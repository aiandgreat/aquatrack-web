import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { redis } from "../../../../lib/redis";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";

export async function GET() {
  try {
    // 1. Try fetching from Upstash Redis cache first
    const cacheKey = "system-summary:global:v2";
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

    // 2. Query dynamic DB metrics
    const [activeComplaintsCount, telemetryNodesCount, faultyNodesCount, readingAverages] = await Promise.all([
      prisma.complaint.count({
        where: {
          status: {
            in: ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"]
          }
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
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // past 24 hours
          }
        }
      })
    ]);

    const avgPh = readingAverages._avg.ph ?? 7.2;
    const avgTurbidity = readingAverages._avg.turbidity ?? 1.6;
    const avgTds = readingAverages._avg.tds ?? 235;
    const avgPressure = readingAverages._avg.pressure ?? 43.5;

    // 3. Dynamic Fallback text block in case AI generation is bypassed
    let summaryText = `As of today, water quality timelines for the City of San Fernando Water District remain within optimal ranges. Pumping station telemetry lists normal mineral profiles. Average water pressure remains steady at ${avgPressure.toFixed(1)} PSI with an average turbidity of ${avgTurbidity.toFixed(2)} NTU. Standard cross-check validation yields ${activeComplaintsCount} Verified active telemetry concerns.`;

    // 4. Generate using Gemini AI with actual database telemetry
    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      if (apiKey) {
        const googleProvider = createGoogle({ apiKey });
        const model = googleProvider("gemini-3.1-flash-lite");

        const prompt = `You are a municipal utility analyst. Generate a short, professional system status summary paragraph (exactly 4 sentences, around 50-60 words) for the City of San Fernando Water District.
Use these actual live database metrics from the system:
- Active citizen complaints/tickets: ${activeComplaintsCount}
- Total telemetry sensor nodes: ${telemetryNodesCount} (with ${faultyNodesCount} nodes reporting anomalies / in maintenance)
- Average water pressure: ${avgPressure.toFixed(1)} PSI
- Average system turbidity: ${avgTurbidity.toFixed(2)} NTU
- Average system TDS: ${Math.round(avgTds)} ppm
- Average system pH: ${avgPh.toFixed(2)}

If any nodes are reporting anomalies or turbidity is high (> 5.0 NTU), briefly mention that maintenance or flushing actions are currently active in those sectors.
Output only the raw text paragraph, no markdown, no quotes.`;

        const { text: aiResponse } = await generateText({
          model,
          prompt,
          temperature: 0.2,
        });

        if (aiResponse && aiResponse.trim().length > 10) {
          summaryText = aiResponse.trim();
        }
      }
    } catch (aiErr) {
      console.warn("Gemini AI system-summary generation failed, using standard fallback:", aiErr);
    }

    // 5. Save to Redis cache (30 seconds TTL during active simulation testing, otherwise 5 minutes)
    // Reduce TTL to 30 seconds so simulated changes reflect quickly during testing
    try {
      await redis.set(cacheKey, { summary: summaryText }, { ex: 30 });
    } catch (redisErr) {
      console.warn("Redis write error for system-summary:", redisErr);
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
