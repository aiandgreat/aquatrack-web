import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL") ?? "";
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TelemetryPayload {
  nodeId: string;
  ph: number;
  turbidity: number;
  tds: number;
  pressure: number;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  try {
    const payload: TelemetryPayload = await req.json();
    const { nodeId, ph, turbidity, tds, pressure } = payload;

    if (!nodeId || ph === undefined || turbidity === undefined || tds === undefined || pressure === undefined) {
      return new Response("Invalid payload", { status: 400 });
    }

    // 1. Hot cache update in Redis via HTTP Fetch (non-fatal)
    try {
      if (REDIS_URL && REDIS_TOKEN) {
        await fetch(`${REDIS_URL}/set/node:latest:${nodeId}`, {
          headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
    } catch (redisErr) {
      console.warn("[telemetry-ingest] Redis cache write failed (non-fatal):", redisErr);
    }

    // 2. Threshold checks
    const hasAnomaly = pressure < 30 || ph < 6.5 || ph > 8.5 || turbidity > 5 || tds > 500;
    
    if (hasAnomaly) {
      const { error: insertAnomalyErr } = await supabase
        .from("TelemetryReading")
        .insert({ id: crypto.randomUUID(), nodeId, ph, turbidity, tds, pressure });
      if (insertAnomalyErr) console.error("[telemetry-ingest] Failed to insert anomaly reading:", insertAnomalyErr);

      // Dynamic AI Spatial Diagnostics Correlation
      try {
        const { data: node } = await supabase
          .from("TelemetryNode")
          .select("name, type, latitude, longitude")
          .eq("id", nodeId)
          .single();

        if (node) {
          let differentialNotes = "";
          let isSourceNormal = false;
          let nearestPumpName = "";

          const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371e3; // meters
            const phi1 = (lat1 * Math.PI) / 180;
            const phi2 = (lat2 * Math.PI) / 180;
            const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
            const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
            const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
          };

          if (node.type === "HOUSEHOLD_EDGE") {
            const { data: pumpStations } = await supabase
              .from("TelemetryNode")
              .select("id, name, latitude, longitude")
              .eq("type", "PUMP_STATION");

            if (pumpStations && pumpStations.length > 0) {
              let nearestPump = null;
              let minDistance = Infinity;

              for (const pump of pumpStations) {
                const dist = calculateDistance(node.latitude, node.longitude, pump.latitude, pump.longitude);
                if (dist < minDistance) {
                  minDistance = dist;
                  nearestPump = pump;
                }
              }

              if (nearestPump) {
                nearestPumpName = nearestPump.name;
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
                const { data: pumpReadings } = await supabase
                  .from("TelemetryReading")
                  .select("ph, turbidity, tds, pressure")
                  .eq("nodeId", nearestPump.id)
                  .gte("timestamp", oneHourAgo)
                  .order("timestamp", { ascending: false })
                  .limit(1);

                if (pumpReadings && pumpReadings.length > 0) {
                  const latestPumpReading = pumpReadings[0];
                  const pumpIsNormal = latestPumpReading.pressure >= 30 &&
                                       latestPumpReading.ph >= 6.5 && latestPumpReading.ph <= 8.5 &&
                                       latestPumpReading.turbidity <= 5 &&
                                       latestPumpReading.tds <= 500;
                  if (pumpIsNormal) {
                    isSourceNormal = true;
                    differentialNotes = `[Differential Diagnosis] Nearest source pump station (${nearestPump.name}) is operating normally. Anomaly isolated to local pipeline network segment downstream of source.`;
                  } else {
                    differentialNotes = `[Differential Diagnosis] Nearest source pump station (${nearestPump.name}) is ALSO reporting anomalies (Systemic Source Failure). Issues are cascading downstream.`;
                  }
                } else {
                  differentialNotes = `[Differential Diagnosis] Nearest source pump station (${nearestPump.name}) has no recent telemetry. Source status unclear.`;
                }
              }
            }
          }

          const { data: activeComplaints } = await supabase
            .from("Complaint")
            .select("id, category, summary, rawText, latitude, longitude, createdAt")
            .neq("status", "RESOLVED");

          if (activeComplaints && activeComplaints.length > 0) {
            const nearby = activeComplaints
              .map((c: any) => ({
                ...c,
                distance: calculateDistance(c.latitude, c.longitude, node.latitude, node.longitude)
              }))
              .filter((c: any) => c.distance <= 500);

            if (nearby.length > 0) {
              const matchedCorrelations: Array<{
                complaint: any;
                category: string;
                baseRootCause: string;
                anomalyPrefix: string;
                action: string;
                priorityWeight: number;
              }> = [];

              for (const comp of nearby) {
                // 1. Turbidity Match
                if (turbidity > 5 && comp.category === "HIGH_TURBIDITY") {
                  matchedCorrelations.push({
                    complaint: comp,
                    category: comp.category,
                    baseRootCause: "Elevated Turbidity / Sediment Contamination",
                    anomalyPrefix: isSourceNormal ? "Localized Pipeline Sedimentation / Infiltration" : "Systemic Source Sedimentation Failure",
                    action: "Flush supply lines, clear downstream filters, and check sedimentation tanks.",
                    priorityWeight: 80 + Math.min(20, turbidity - 5)
                  });
                }

                // 2. Pressure Breach Match
                if (pressure < 30 && comp.category === "PIPELINE_BREACH_PRESSURE_DROP") {
                  matchedCorrelations.push({
                    complaint: comp,
                    category: comp.category,
                    baseRootCause: "Low Water Pressure Breach",
                    anomalyPrefix: isSourceNormal ? "Intermediary Pipeline Breach" : "Systemic Source Pressure Drop",
                    action: isSourceNormal 
                      ? `Dispatch crew to inspect pipeline segment between ${node.name} and source ${nearestPumpName || "station"} for physical leaks.` 
                      : "Inspect main supply pressure valves and pump station operations.",
                    priorityWeight: 100 + (30 - pressure)
                  });
                }

                // 3. pH Deviation Match
                if ((ph < 6.5 || ph > 8.5) && comp.category === "CHEMICAL_DISCOLORATION_CONTAMINATION") {
                  const phDeviation = ph < 6.5 ? (6.5 - ph) : (ph - 8.5);
                  matchedCorrelations.push({
                    complaint: comp,
                    category: comp.category,
                    baseRootCause: `pH Level Deviation (${ph < 6.5 ? "Acidic" : "Alkaline"})`,
                    anomalyPrefix: isSourceNormal ? "Localized Pipe Contamination" : "Systemic Chemical Contamination",
                    action: "Isolate local pipeline segment and treat water source.",
                    priorityWeight: 90 + (phDeviation * 10)
                  });
                }

                // 4. TDS Mineral Match
                if (tds > 500 && comp.category === "HIGH_MINERAL_CONTENT_TDS") {
                  matchedCorrelations.push({
                    complaint: comp,
                    category: comp.category,
                    baseRootCause: "High Mineral Content (TDS Exceeded)",
                    anomalyPrefix: isSourceNormal ? "Localized Pipe Mineral Leaching" : "Systemic Source Mineral Intrusion",
                    action: "Inspect filtration systems and run chemical composition analysis.",
                    priorityWeight: 70 + Math.min(20, (tds - 500) / 50)
                  });
                }
              }

              if (matchedCorrelations.length > 0) {
                // Rank correlations by weight first, then by nearest proximity
                matchedCorrelations.sort((a, b) => {
                  if (b.priorityWeight !== a.priorityWeight) {
                    return b.priorityWeight - a.priorityWeight;
                  }
                  return a.complaint.distance - b.complaint.distance;
                });

                const primaryMatch = matchedCorrelations[0];
                const comp = primaryMatch.complaint;

                const uniqueMatchedComplaintIds = new Set(matchedCorrelations.map(m => m.complaint.id));
                const totalMatchedComplaints = uniqueMatchedComplaintIds.size;

                const finalRootCause = `${primaryMatch.anomalyPrefix} (${primaryMatch.baseRootCause})`;

                const distMeters = comp.distance;
                const baseConf = isSourceNormal ? 98 : 90;
                const distPenalty = (distMeters / 500) * 10;
                
                const timeDiffHrs = Math.abs(Date.now() - new Date(comp.createdAt).getTime()) / (1000 * 60 * 60);
                const timePenalty = Math.min(10, (timeDiffHrs / 12) * 10);

                const multiComplaintBonus = Math.min(5, (totalMatchedComplaints - 1) * 2);

                const calculatedConf = Math.round(baseConf - distPenalty - timePenalty + multiComplaintBonus);
                const finalConfidenceScore = Math.max(80, Math.min(99, calculatedConf));

                const secondaryAnomalies = matchedCorrelations.filter(m => m.category !== primaryMatch.category);
                let multiAnomalyNote = "";
                if (secondaryAnomalies.length > 0) {
                  const secondaryCauses = secondaryAnomalies.map(s => s.baseRootCause).join(", ");
                  multiAnomalyNote = ` Concurrent secondary anomalies detected: [${secondaryCauses}].`;
                }

                const geminiAnalysis = {
                  rootCauseAnalysis: `Citizen reported: "${comp.summary || comp.rawText}". Sensor node ${node.name} (${node.type}) confirmed threshold breach.${multiAnomalyNote} ${differentialNotes}`,
                  probableRootCause: finalRootCause,
                  confidenceScore: finalConfidenceScore,
                  recommendedAction: primaryMatch.action
                };

                const { data: existingAlert } = await supabase
                  .from("DiagnosticAlert")
                  .select("id")
                  .eq("nodeId", nodeId)
                  .in("status", ["PENDING", "ONGOING"])
                  .maybeSingle();

                if (existingAlert) {
                  await supabase
                    .from("DiagnosticAlert")
                    .update({
                      complaintCount: totalMatchedComplaints,
                      geminiAnalysis
                    })
                    .eq("id", existingAlert.id);
                  console.log(`[Edge Function] Updated DiagnosticAlert ${existingAlert.id} for node ${node.name} (${finalRootCause})`);
                } else {
                  await supabase
                    .from("DiagnosticAlert")
                    .insert({
                      id: crypto.randomUUID(),
                      nodeId,
                      complaintCount: totalMatchedComplaints,
                      geminiAnalysis,
                      status: "PENDING"
                    });
                  console.log(`[Edge Function] Created DiagnosticAlert for node ${node.name} (${finalRootCause})`);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error during edge function spatial correlation:", err);
      }
    } else {
      await supabase
        .from("TelemetryNode")
        .update({ status: "ONLINE" })
        .eq("id", nodeId);

      const { error: insertNormalErr } = await supabase
        .from("TelemetryReading")
        .insert({ id: crypto.randomUUID(), nodeId, ph, turbidity, tds, pressure });
      if (insertNormalErr) console.error("[telemetry-ingest] Failed to insert normal reading:", insertNormalErr);
    }

    return new Response(JSON.stringify({ success: true, anomaly: hasAnomaly }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
});