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

    // 1. Hot cache update in Redis via HTTP Fetch to Upstash REST API (non-fatal: DB insert always proceeds)
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
      // Save anomalous reading to history — must provide id since Postgres has no DEFAULT for the column
      const { error: insertAnomalyErr } = await supabase
        .from("TelemetryReading")
        .insert({ id: crypto.randomUUID(), nodeId, ph, turbidity, tds, pressure });
      if (insertAnomalyErr) console.error("[telemetry-ingest] Failed to insert anomaly reading:", insertAnomalyErr);

      // Dynamic AI Spatial Diagnostics Correlation for existing unresolved complaints
      try {
        const { data: node } = await supabase
          .from("TelemetryNode")
          .select("name, latitude, longitude")
          .eq("id", nodeId)
          .single();

        if (node) {
          const { data: activeComplaints } = await supabase
            .from("Complaint")
            .select("id, category, summary, rawText, latitude, longitude")
            .neq("status", "RESOLVED");

          if (activeComplaints) {
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

            const nearby = activeComplaints.filter((c: any) => {
              const dist = calculateDistance(c.latitude, c.longitude, node.latitude, node.longitude);
              return dist <= 500;
            });

            for (const comp of nearby) {
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
                // Check if active alert already exists
                const { data: existingAlert } = await supabase
                  .from("DiagnosticAlert")
                  .select("id")
                  .eq("nodeId", nodeId)
                  .in("status", ["PENDING", "ONGOING"])
                  .maybeSingle();

                const geminiAnalysis = {
                  rootCauseAnalysis: `Citizen reported: "${comp.summary || comp.rawText}". Nearest sensor node ${node.name} shows threshold breaches.`,
                  probableRootCause: rootCause,
                  confidenceScore: 95,
                  recommendedAction: action
                };

                if (existingAlert) {
                  await supabase
                    .from("DiagnosticAlert")
                    .update({ geminiAnalysis })
                    .eq("id", existingAlert.id);
                  console.log(`[Edge Function] Updated existing DiagnosticAlert ${existingAlert.id} for node ${node.name} correlated with complaint ${comp.id}`);
                } else {
                  await supabase
                    .from("DiagnosticAlert")
                    .insert({
                      nodeId,
                      complaintCount: 1,
                      geminiAnalysis,
                      status: "PENDING"
                    });
                  console.log(`[Edge Function] Created DiagnosticAlert for node ${node.name} correlated with complaint ${comp.id}`);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error during edge function spatial correlation:", err);
      }
    } else {
      // Normal readings: revert status to ONLINE and record normal readings to history
      await supabase
        .from("TelemetryNode")
        .update({ status: "ONLINE" })
        .eq("id", nodeId);

      // Must provide id since Postgres has no DEFAULT for the id column
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
