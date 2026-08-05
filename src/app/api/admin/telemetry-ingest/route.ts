import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      return NextResponse.json({ error: "Missing NEXT_PUBLIC_SUPABASE_URL in env" }, { status: 500 });
    }

    // Server-to-server call: bypasses browser CORS block entirely
    const res = await fetch(`${supabaseUrl}/functions/v1/telemetry-ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText }, { status: res.status });
    }

    const data = await res.json();

    // Perform database correlation for active complaints within 500m
    try {
      const { prisma } = await import("../../../../lib/prisma");
      const { calculateDistance } = await import("../../../../lib/spatial-sorting");

      const { nodeId, ph, turbidity, tds, pressure } = payload;
      const node = await prisma.telemetryNode.findUnique({
        where: { id: nodeId }
      });

      if (node && (pressure < 30 || ph < 6.5 || ph > 8.5 || turbidity > 5 || tds > 500)) {
        const activeComplaints = await prisma.complaint.findMany({
          where: {
            status: { not: "RESOLVED" }
          }
        });

        const nearbyComplaints = activeComplaints.filter(c => {
          const dist = calculateDistance(
            { latitude: c.latitude, longitude: c.longitude },
            { latitude: node.latitude, longitude: node.longitude }
          );
          return dist <= 500;
        });

        for (const comp of nearbyComplaints) {
          let isMatch = false;
          let rootCause = "";
          let action = "";

          if (pressure < 30 && comp.category === "PIPELINE_BREACH_PRESSURE_DROP") {
            isMatch = true;
            rootCause = "Low water pressure breach (Leak or Pipe Breach)";
            action = "Inspect main supply pressure valves and scan for pipeline leaks.";
          } else if (turbidity > 5 && comp.category === "HIGH_TURBIDITY") {
            isMatch = true;
            rootCause = "Elevated turbidity / muddy water quality anomaly";
            action = "Flush supply lines and check sedimentation tanks.";
          } else if (tds > 500 && comp.category === "HIGH_MINERAL_CONTENT_TDS") {
            isMatch = true;
            rootCause = "High mineral content / TDS levels exceeded";
            action = "Inspect filtration system and run chemical analysis.";
          } else if ((ph < 6.5 || ph > 8.5) && comp.category === "CHEMICAL_DISCOLORATION_CONTAMINATION") {
            isMatch = true;
            rootCause = "pH level deviation (possible contamination)";
            action = "Isolate pipeline segment and treat water source.";
          }

          if (isMatch) {
            const existingAlert = await prisma.diagnosticAlert.findFirst({
              where: {
                nodeId: node.id,
                status: { in: ["PENDING", "ONGOING"] }
              }
            });

            const geminiAnalysis = {
              rootCauseAnalysis: `Citizen reported: "${comp.summary || comp.rawText}". Nearest sensor node ${node.name} shows threshold breaches.`,
              probableRootCause: rootCause,
              confidenceScore: 95,
              recommendedAction: action
            };

            if (existingAlert) {
              await prisma.diagnosticAlert.update({
                where: { id: existingAlert.id },
                data: { geminiAnalysis: geminiAnalysis }
              });
              console.log(`[Telemetry Ingest API] Updated existing DiagnosticAlert ${existingAlert.id} for node ${node.name} correlated with complaint ${comp.id}`);
            } else {
              await prisma.diagnosticAlert.create({
                data: {
                  nodeId: node.id,
                  complaintCount: 1,
                  geminiAnalysis: geminiAnalysis,
                  status: "PENDING"
                }
              });
              console.log(`[Telemetry Ingest API] Created DiagnosticAlert for node ${node.name} correlated with complaint ${comp.id}`);
            }
          }
        }
      }
    } catch (dbErr) {
      console.error("[Telemetry Ingest API] Failed to run spatial diagnostic correlation:", dbErr);
    }

    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
