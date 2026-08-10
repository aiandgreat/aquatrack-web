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
        // Differential Diagnostic: If node is HOUSEHOLD_EDGE, cross-reference the nearest PUMP_STATION
        let differentialNotes = "";
        let isLocalPipelineBreach = false;
        let nearestPumpName = "";

        if (node.type === "HOUSEHOLD_EDGE") {
          const pumpStations = await prisma.telemetryNode.findMany({
            where: { type: "PUMP_STATION" }
          });

          let nearestPump = null;
          let minDistance = Infinity;

          for (const pump of pumpStations) {
            const dist = calculateDistance(
              { latitude: node.latitude, longitude: node.longitude },
              { latitude: pump.latitude, longitude: pump.longitude }
            );
            if (dist < minDistance) {
              minDistance = dist;
              nearestPump = pump;
            }
          }

          if (nearestPump) {
            nearestPumpName = nearestPump.name;
            const latestPumpReading = await prisma.telemetryReading.findFirst({
              where: {
                nodeId: nearestPump.id,
                timestamp: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last 1 hour
              },
              orderBy: { timestamp: "desc" }
            });

            if (latestPumpReading) {
              const pumpIsNormal = latestPumpReading.pressure >= 30 &&
                                   latestPumpReading.ph >= 6.5 && latestPumpReading.ph <= 8.5 &&
                                   latestPumpReading.turbidity <= 5 &&
                                   latestPumpReading.tds <= 500;
              if (pumpIsNormal) {
                isLocalPipelineBreach = true;
                differentialNotes = `[Differential Diagnosis] Nearest source pump station (${nearestPump.name}) is operating normally. Anomaly isolated to local pipeline network (leak/breach/contamination downstream of source).`;
              } else {
                differentialNotes = `[Differential Diagnosis] Nearest source pump station (${nearestPump.name}) is ALSO reporting anomalies (Systemic Source Failure). Downstream issues are cascading.`;
              }
            } else {
              differentialNotes = `[Differential Diagnosis] Nearest source pump station (${nearestPump.name}) has no recent telemetry. Source status unclear.`;
            }
          }
        }

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

            const finalRootCause = isLocalPipelineBreach 
              ? `Intermediary Pipeline Breach (${rootCause})` 
              : rootCause;
            
            const finalAction = isLocalPipelineBreach
              ? `Dispatch crew to inspect pipeline segment between ${node.name} and source ${nearestPumpName || "station"}.`
              : action;

            // Recalculate distance for dynamic confidence
            const distMeters = calculateDistance(
              { latitude: comp.latitude, longitude: comp.longitude },
              { latitude: node.latitude, longitude: node.longitude }
            );

            // Dynamic Confidence Score Algorithm:
            // - Base is 98 for isolated pipeline breach, 90 for systemic failure
            // - Distance Penalty: up to 10% penalty for 500m distance
            // - Time Penalty: up to 10% penalty for 12 hours delay
            // - Enforces a strict safety floor of 80% so alerts are never ignored
            const baseConf = isLocalPipelineBreach ? 98 : 90;
            const distPenalty = (distMeters / 500) * 10;
            
            const timeDiffHrs = Math.abs(Date.now() - new Date(comp.createdAt).getTime()) / (1000 * 60 * 60);
            const timePenalty = Math.min(10, (timeDiffHrs / 12) * 10);

            const calculatedConf = Math.round(baseConf - distPenalty - timePenalty);
            const finalConfidenceScore = Math.max(80, Math.min(99, calculatedConf));

            const geminiAnalysis = {
              rootCauseAnalysis: `Citizen reported: "${comp.summary || comp.rawText}". Nearest sensor node ${node.name} (${node.type}) shows threshold breaches. ${differentialNotes}`,
              probableRootCause: finalRootCause,
              confidenceScore: finalConfidenceScore,
              recommendedAction: finalAction
            };

            if (existingAlert) {
              await prisma.diagnosticAlert.update({
                where: { id: existingAlert.id },
                data: { geminiAnalysis: geminiAnalysis }
              });
              console.log(`[Telemetry Ingest API] Updated existing DiagnosticAlert ${existingAlert.id} for node ${node.name} correlated with complaint ${comp.id} with dynamic confidence ${finalConfidenceScore}%`);
            } else {
              await prisma.diagnosticAlert.create({
                data: {
                  nodeId: node.id,
                  complaintCount: 1,
                  geminiAnalysis: geminiAnalysis,
                  status: "PENDING"
                }
              });
              console.log(`[Telemetry Ingest API] Created DiagnosticAlert for node ${node.name} correlated with complaint ${comp.id} with dynamic confidence ${finalConfidenceScore}%`);
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
