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

    let payload: { complaintId?: string; latitude?: number; longitude?: number; };
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { complaintId, latitude, longitude, rawText } = payload;
    if (!complaintId) return new Response("Missing ID", { status: 400 });

    // Run database operations in parallel to save latency
    const complaintPromise = rawText
      ? Promise.resolve({ data: { rawText }, error: null })
      : supabase.from("Complaint").select("*").eq("id", complaintId).single();

    const spatialPromise = supabase.rpc("find_nearby_anomalies", {
      report_lat: latitude,
      report_lng: longitude,
      max_distance_meters: 500
    }) as Promise<{ data: Array<{ id: string; name: string; status: string }> | null; error: { message: string } | null }>;

    const [complaintRes, spatialRes] = await Promise.all([complaintPromise, spatialPromise]);

    const complaint = complaintRes.data;
    const complaintError = complaintRes.error;
    if (complaintError || !complaint) return new Response("Complaint not found", { status: 404 });

    const nearbyNodes = spatialRes.data;
    const spatialError = spatialRes.error;
    if (spatialError) {
      console.error("Spatial error:", spatialError);
    }

    // 3. Prepare AI triage request
    const contextNode = nearbyNodes?.[0];
    const systemPrompt = `You are a municipal water district engineer. Parse the following citizen report. Note that the report may be written in English, Tagalog, Taglish, or Kapampangan dialect (e.g., 'kule dilo' refers to yellow color, 'ala danum' refers to no water/low pressure). Translate the report to English, capturing all details including water discoloration, flow, and duration. Classify category (PIPELINE_BREACH_PRESSURE_DROP, HIGH_TURBIDITY, HIGH_MINERAL_CONTENT_TDS, CHEMICAL_DISCOLORATION_CONTAMINATION, UNCLASSIFIED_INFRASTRUCTURE_ANOMALY) and urgency (LOW, MEDIUM, HIGH, CRITICAL). Summarize in one sentence.`;
    
    // Call Gemini API (Structured JSON output)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const aiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\nReport: "${complaint.rawText}"\nNearby Sensor: ${contextNode ? JSON.stringify(contextNode) : "None"}` }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
          maxOutputTokens: 2048,
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING" },
              urgency: { type: "STRING" },
              translatedText: { type: "STRING" },
              summary: { type: "STRING" },
              probableRootCause: { type: "STRING" },
              confidenceScore: { type: "NUMBER" },
              recommendedAction: { type: "STRING" }
            },
            required: ["category", "urgency", "summary"]
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
      probableRootCause?: string;
      confidenceScore?: number;
      recommendedAction?: string;
    } = JSON.parse(resultText);

    // 4. Update the complaint in Database
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

    // 5. If spatial correlation matched, create a DiagnosticAlert
    if (contextNode) {
      const geminiAnalysis = {
        rootCauseAnalysis: `Citizen reported: "${result.summary}". Nearest sensor node ${contextNode.name} shows threshold breaches.`,
        probableRootCause: result.probableRootCause || "Localized pipe breach",
        confidenceScore: result.confidenceScore || 80,
        recommendedAction: result.recommendedAction || "Inspect node valves"
      };

      const { error: insertError } = await supabase
        .from("DiagnosticAlert")
        .insert({
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
