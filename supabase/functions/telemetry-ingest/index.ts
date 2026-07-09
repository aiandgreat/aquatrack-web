import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const REDIS_URL = Deno.env.get("UPSTASH_REDIS_REST_URL")!;
const REDIS_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN")!;

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

    // 1. Hot cache update in Redis via HTTP Fetch to Upstash REST API
    await fetch(`${REDIS_URL}/set/node:latest:${nodeId}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      method: "POST",
      body: JSON.stringify(payload),
    });

    // 2. Threshold checks
    const hasAnomaly = pressure < 30 || ph < 6.5 || ph > 8.5 || turbidity > 5 || tds > 500;
    
    if (hasAnomaly) {
      const status = pressure <= 5 ? "OFFLINE" : "MAINTENANCE";
      
      // Update Node Status
      await supabase
        .from("TelemetryNode")
        .update({ status })
        .eq("id", nodeId);

      // Save Reading History
      await supabase
        .from("TelemetryReading")
        .insert({ nodeId, ph, turbidity, tds, pressure });
    }

    return new Response(JSON.stringify({ success: true, anomaly: hasAnomaly }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
});
