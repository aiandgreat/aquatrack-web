import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { redis } from "../../../../lib/redis";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { createVertex } from "@ai-sdk/google-vertex";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const isFiltered = !!(fromParam && toParam);

    if (isFiltered) {
      startDate = new Date(fromParam!);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(toParam!);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    // 1. Try fetching from Upstash Redis cache first (only if NOT filtered)
    const cacheKey = "system-summary:global:v2";
    if (!isFiltered) {
      try {
        const cached = await redis.get<{ summary: string }>(cacheKey);
        if (cached?.summary) {
          return NextResponse.json({
            success: true,
            summary: cached.summary,
            cached: true
          });
        }
      } catch (redisErr) {
        console.warn("Redis read error on system-summary, bypassing cache:", redisErr);
      }
    }

    // 2. Query dynamic DB metrics
    const [
      activeComplaintsCount,
      telemetryNodesCount,
      faultyNodesCount,
      readingAverages,
      faultyNodesList,
      activeComplaintsList
    ] = await Promise.all([
      prisma.complaint.count({
        where: {
          status: {
            in: ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"]
          },
          createdAt: isFiltered ? {
            gte: startDate!,
            lte: endDate!,
          } : undefined
        }
      }),
      prisma.telemetryNode.count(),
      prisma.telemetryNode.count({
        where: {
          status: {
            in: ["MAINTENANCE", "OFFLINE"]
          }
        }
      }),
      prisma.telemetryReading.aggregate({
        _avg: {
          ph: true,
          turbidity: true,
          tds: true,
          pressure: true
        },
        where: {
          timestamp: {
            gte: isFiltered ? startDate! : new Date(Date.now() - 24 * 60 * 60 * 1000), // past 24 hours if default
            lte: isFiltered ? endDate! : undefined
          }
        }
      }),
      prisma.telemetryNode.findMany({
        where: {
          status: {
            in: ["MAINTENANCE", "OFFLINE"]
          }
        },
        select: {
          name: true,
          type: true,
          status: true
        }
      }),
      prisma.complaint.findMany({
        where: {
          status: {
            in: ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"]
          },
          createdAt: isFiltered ? {
            gte: startDate!,
            lte: endDate!,
          } : undefined
        },
        select: {
          barangay: true
        }
      })
    ]);

    const avgPh = readingAverages._avg.ph ?? 7.2;
    const avgTurbidity = readingAverages._avg.turbidity ?? 1.6;
    const avgTds = readingAverages._avg.tds ?? 235;
    const avgPressure = readingAverages._avg.pressure ?? 43.5;

    // Count complaints by barangay to find hotspots
    const barangayCountsMap: Record<string, number> = {};
    activeComplaintsList.forEach((c) => {
      if (c.barangay) {
        barangayCountsMap[c.barangay] = (barangayCountsMap[c.barangay] || 0) + 1;
      }
    });
    const sortedHotspots = Object.entries(barangayCountsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name, count]) => `${name} (${count} reports)`);

    const faultyNodesSummary = faultyNodesList
      .map((n) => `${n.name} [${n.type === "PUMP_STATION" ? "Source Pump Station" : "Household Edge Node"}] (${n.status})`)
      .join(", ");

    // 3. Dynamic Fallback text block in case AI generation is bypassed
    let summaryText = "";
    const isAnomalous = activeComplaintsCount > 0 || faultyNodesCount > 0 || avgPressure < 30 || avgTurbidity > 5 || avgPh < 6.5 || avgPh > 8.5;
    
    if (isAnomalous) {
      const hotspotText = sortedHotspots.length > 0 ? `in **${sortedHotspots[0].split(" (")[0]}**` : "";
      summaryText = `Localized water network anomalies are currently detected ${hotspotText}. Telemetry logs list ${faultyNodesCount} sensor warnings alongside ${activeComplaintsCount} pending citizen reports. The overall district line pressure averages steady at ${avgPressure.toFixed(1)} PSI with normal system turbidity levels.

Recommended Actions:
${faultyNodesList.map(n => n.type === "PUMP_STATION" 
  ? `- **${n.name}**: Inspect source pump station immediately.` 
  : `- **${n.name}**: Inspect downstream lines near household node.`).slice(0, 2).join("\n")}
${sortedHotspots.map(b => `- **Barangay ${b.split(" (")[0]}**: Resolve active pipeline leaks.`).slice(0, 2).join("\n")}`;
    } else {
      summaryText = `All municipal systems are operating within normal water quality compliance ranges. Primary line pressure is steady at ${avgPressure.toFixed(1)} PSI and average turbidity reads clear at ${avgTurbidity.toFixed(2)} NTU. Standard water district compliance checks yield zero chemical or infrastructure advisory warnings, and no corrective actions are currently required.`;
    }

    // 4. Generate using Gemini AI with actual database telemetry
    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      const vertexCredentials = process.env.GOOGLE_VERTEX_CREDENTIALS;
      
      let model: any;
      let usingVertex = false;

      if (vertexCredentials) {
        try {
          const trimmed = vertexCredentials.trim();
          const decodedCreds = (trimmed.startsWith("{") || trimmed.startsWith("'") || trimmed.startsWith('"'))
            ? trimmed.replace(/^['"]|['"]$/g, "")
            : atob(trimmed);
          const vertex = createVertex({
            project: process.env.GOOGLE_VERTEX_PROJECT || "aquatrack-prod",
            location: process.env.GOOGLE_VERTEX_LOCATION || "global",
            googleAuthOptions: {
              credentials: JSON.parse(decodedCreds)
            }
          });
          model = vertex("gemini-3.5-flash-lite");
          usingVertex = true;
        } catch (err: any) {
          console.error("[System Summary API] Failed to parse Vertex credentials, falling back to AI Studio:", err.message);
        }
      }

      if (!usingVertex || !model) {
        if (!apiKey) {
          throw new Error("Missing Gemini API key configurations or Vertex credentials");
        }
        const googleProvider = createGoogle({ apiKey });
        model = googleProvider("gemini-3.5-flash-lite");
      }

        const prompt = `You are a municipal utility analyst for the City of San Fernando Water District.
Generate a concise, professional, data-driven system status summary and action plan.

Use these actual live database metrics from the system:
- Active citizen complaints/tickets: ${activeComplaintsCount}
- Total telemetry sensor nodes: ${telemetryNodesCount} (with ${faultyNodesCount} nodes reporting anomalies or in maintenance)
- Average water pressure: ${avgPressure.toFixed(1)} PSI
- Average system turbidity: ${avgTurbidity.toFixed(2)} NTU
- Average system TDS: ${Math.round(avgTds)} ppm
- Average system pH: ${avgPh.toFixed(2)}
- List of faulty/offline/maintenance nodes: ${faultyNodesSummary || "None"}
- Top Hotspot Barangays with active complaints: ${sortedHotspots.join(", ") || "None"}

Instructions:
1. First, write a professional 3-sentence high-level overview paragraph summarizing network status.
2. If there are any active complaints, faulty nodes, or average metrics out of safety ranges (pH < 6.5 or > 8.5, turbidity > 5, TDS > 500, pressure < 30):
   - Add a blank line.
   - Write: "Recommended Actions:"
   - List 2 to 4 bulleted recommendations (using a simple dash '-' for bullets). Be highly specific and concise:
     - Bullets 1-2: Target specific faulty nodes by name. IMPORTANT: Format exactly as: **[Node Name]**: [Action Step] (for example: **Alasas Pumping Station**: Inspect pump regulator).
     - Bullets 3-4: Target specific hotspot barangays by name. IMPORTANT: Format exactly as: **[Barangay Name]**: [Action Step] (for example: **Barangay Calulut**: Trace downstream pressure drops).
3. If there are ZERO active complaints, ZERO faulty nodes, and ALL metrics are within normal safe ranges:
   - Do NOT include any "Recommended Actions:" header or bullet points.
   - End with a clean statement verifying that all infrastructure systems are operating within compliant baselines and no corrective actions are required.

Output only the raw text, do not wrap in markdown or quotes. Keep it concise (maximum 80-90 words total).`;

        const { text: aiResponse } = await generateText({
          model,
          prompt,
          temperature: 0.0,
        });

        if (aiResponse && aiResponse.trim().length > 10) {
          summaryText = aiResponse.trim();
        }
    } catch (aiErr) {
      console.warn("Gemini AI system-summary generation failed, using standard fallback:", aiErr);
    }

    // 5. Save to Redis cache (only if NOT filtered)
    if (!isFiltered) {
      try {
        await redis.set(cacheKey, { summary: summaryText }, { ex: 30 });
      } catch (redisErr) {
        console.warn("Redis write error for system-summary:", redisErr);
      }
    }

    return NextResponse.json({
      success: true,
      summary: summaryText,
      cached: false
    });
  } catch (err: any) {
    console.error("System summary error:", err);
    return NextResponse.json({ error: err.message || "Failed to compile system summary" }, { status: 500 });
  }
}
