import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
  throw new Error("Missing required environment variables.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  
  try {
    const bodyText = await req.text();
    if (!bodyText) return new Response("Missing body", { status: 400 });

    let payload: { complaintId?: string; latitude?: number; longitude?: number; rawText?: string };
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { complaintId, latitude, longitude, rawText } = payload;
    if (!complaintId) return new Response("Missing ID", { status: 400 });

    const complaintPromise = rawText
      ? Promise.resolve({ data: { rawText }, error: null })
      : supabase.from("Complaint").select("*").eq("id", complaintId).single();

    const spatialPromise = supabase.rpc("find_nearby_anomalies", {
      report_lat: latitude,
      report_lng: longitude,
      max_distance_meters: 500
    }) as Promise<{ data: Array<{ id: string; name: string; status: string; signal: string }> | null; error: { message: string } | null }>;

    const [complaintRes, spatialRes] = await Promise.all([complaintPromise, spatialPromise]);

    const complaint = complaintRes.data;
    const complaintError = complaintRes.error;
    if (complaintError || !complaint) return new Response("Complaint not found", { status: 404 });

    const nearbyNodes = spatialRes.data;
    const spatialError = spatialRes.error;
    if (spatialError) {
      console.error("Spatial error:", spatialError);
    }

    const contextNode = nearbyNodes?.[0];
    const systemPrompt = `You are a municipal water district engineer parsing a citizen report (in English, Tagalog, Taglish, or Kapampangan).

Kapampangan Guide:
- "danum" = water
- "kayna" / "mayna" / "kumayna" / "mababa agus" = weak water flow / low water pressure
- "ala danum" / "alang danum" / "marang" = no water / dry faucet
- "matuling" / "kule matuling" = dark water
- "dilo" / "kule dilo" / "kulasisi" = yellow / yellowish water (HIGH_MINERAL_CONTENT_TDS or HIGH_TURBIDITY)
- "malutu" / "kule malutu" = red / rust water
- "taya" / "kule taya" = brown / muddy water (HIGH_TURBIDITY)
- "mabau" = smelly / bad odor
- "agus" = flow / stream
- "gripo" = faucet / tap

Categories:
- PIPELINE_BREACH_PRESSURE_DROP
- HIGH_TURBIDITY
- HIGH_MINERAL_CONTENT_TDS
- CHEMICAL_DISCOLORATION_CONTAMINATION
- UNCLASSIFIED_INFRASTRUCTURE_ANOMALY

Standardized probableRootCause mapping rules:
- If HIGH_TURBIDITY: "Localized Pipeline Sedimentation / Infiltration (Elevated Turbidity / Sediment Contamination)"
- If PIPELINE_BREACH_PRESSURE_DROP: "Intermediary Pipeline Breach (Low Water Pressure Breach)"
- If HIGH_MINERAL_CONTENT_TDS: "Localized Pipe Mineral Leaching (High Mineral Content (TDS Exceeded))"
- If CHEMICAL_DISCOLORATION_CONTAMINATION: "Localized Pipe Contamination (pH Level Deviation / Discoloration)"
- Otherwise: "Unclassified Infrastructure Anomaly"

Standardized recommendedAction mapping rules:
- If HIGH_TURBIDITY: "Flush supply lines, clear downstream filters, and check sedimentation tanks."
- If PIPELINE_BREACH_PRESSURE_DROP: "Dispatch crew to inspect pipeline segment for physical leaks."
- If HIGH_MINERAL_CONTENT_TDS: "Inspect filtration systems and run chemical composition analysis."
- If CHEMICAL_DISCOLORATION_CONTAMINATION: "Isolate local pipeline segment and treat water source."

Disambiguation Rule for Water Quality vs Minerals:
- Do NOT classify high TDS or yellowish/salty water as pH deviation. If the anomaly is high mineral content or TDS exceedance, strictly assign category HIGH_MINERAL_CONTENT_TDS.
- Only assign CHEMICAL_DISCOLORATION_CONTAMINATION if there is an explicit pH imbalance or chemical odor/contamination reported.

Translate the report to English, assign category, urgency (LOW, MEDIUM, HIGH, CRITICAL), summary (1 sentence), probableRootCause, and recommendedAction based on the rules above.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const aiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\nReport: "${complaint.rawText}"\nNearby Sensor: ${contextNode ? JSON.stringify(contextNode) : "None"}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.0,
          maxOutputTokens: 2048,
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: {
                type: "STRING",
                enum: [
                  "PIPELINE_BREACH_PRESSURE_DROP",
                  "HIGH_TURBIDITY",
                  "HIGH_MINERAL_CONTENT_TDS",
                  "CHEMICAL_DISCOLORATION_CONTAMINATION",
                  "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY"
                ]
              },
              urgency: { type: "STRING", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
              translatedText: { type: "STRING" },
              summary: { type: "STRING" },
              probableRootCause: { type: "STRING" },
              confidenceScore: { type: "NUMBER" },
              recommendedAction: { type: "STRING" }
            },
            required: ["category", "urgency", "summary", "probableRootCause", "recommendedAction"]
          }
        }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`Gemini API error: ${aiResponse.status} ${errorText}`);
    }

    const aiJson = (await aiResponse.json()) as {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>;
        };
      }>;
    };
    const resultText = aiJson.candidates[0].content.parts[0].text;
    const result: {
      category: string;
      urgency: string;
      translatedText?: string;
      summary: string;
      probableRootCause: string;
      confidenceScore?: number;
      recommendedAction: string;
    } = JSON.parse(resultText);

    const { error: updateError } = await supabase
      .from("Complaint")
      .update({
        translatedText: result.translatedText || null,
        summary: result.summary,
        category: result.category,
        urgency: result.urgency,
        aiStatus: "SUCCESS"
      })
      .eq("id", complaintId);

    if (updateError) {
      throw new Error(`Failed to update complaint: ${updateError.message}`);
    }

    if (contextNode) {
      const geminiAnalysis = {
        rootCauseAnalysis: `Nearest sensor node ${contextNode.name} identified showing threshold breaches.`,
        probableRootCause: result.probableRootCause,
        confidenceScore: result.confidenceScore || 85,
        recommendedAction: result.recommendedAction
      };

      const { error: insertError } = await supabase
        .from("DiagnosticAlert")
        .insert({
          id: crypto.randomUUID(),
          nodeId: contextNode.id,
          complaintCount: 1,
          geminiAnalysis,
          status: "PENDING"
        });

      if (insertError) {
        throw new Error(`Failed to insert diagnostic alert: ${insertError.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (err) {
    const error = err as Error;
    return new Response(error.message, { status: 500 });
  }
});