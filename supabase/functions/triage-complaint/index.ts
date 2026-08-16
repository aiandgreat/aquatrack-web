import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { z } from "https://esm.sh/zod@3.22.4";
import * as jose from "https://esm.sh/jose@5.2.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GOOGLE_VERTEX_CREDENTIALS = Deno.env.get("GOOGLE_VERTEX_CREDENTIALS");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || (!GEMINI_API_KEY && !GOOGLE_VERTEX_CREDENTIALS)) {
  throw new Error("Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and either GEMINI_API_KEY or GOOGLE_VERTEX_CREDENTIALS).");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const VALID_CATEGORIES = [
  "PIPELINE_BREACH_PRESSURE_DROP",
  "HIGH_TURBIDITY",
  "HIGH_MINERAL_CONTENT_TDS",
  "CHEMICAL_DISCOLORATION_CONTAMINATION",
  "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
];

const VALID_URGENCIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function normalizeCategory(value: unknown): string {
  if (!value) return "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY";
  const candidate = String(value).toUpperCase().replace(/\s+/g, "_");
  if (VALID_CATEGORIES.includes(candidate)) return candidate;
  if (candidate.includes("PRESSURE") || candidate.includes("BREACH")) return "PIPELINE_BREACH_PRESSURE_DROP";
  if (candidate.includes("TURBID") || candidate.includes("MUDDY")) return "HIGH_TURBIDITY";
  if (candidate.includes("TDS") || candidate.includes("MINERAL")) return "HIGH_MINERAL_CONTENT_TDS";
  if (candidate.includes("PH") || candidate.includes("CHEMICAL") || candidate.includes("COLOR") || candidate.includes("CONTAMINA")) return "CHEMICAL_DISCOLORATION_CONTAMINATION";
  return "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY";
}

function normalizeUrgency(value: unknown): string {
  if (!value) return "MEDIUM";
  const candidate = String(value).toUpperCase();
  if (VALID_URGENCIES.includes(candidate)) return candidate;
  if (candidate.includes("EMERGENCY")) return "CRITICAL";
  if (candidate.includes("URGENT") || candidate.includes("HIGH")) return "HIGH";
  if (candidate.includes("LOW")) return "LOW";
  return "MEDIUM";
}

// NOTE: This schema mirrors complaintTriageSchema in src/lib/triage-schema.ts
// (inlined here because Deno edge functions cannot import from src/lib).
// KEEP BOTH COPIES IN SYNC when editing enums, fields, or nullability.
const triageResultSchema = z.object({
  category: z.enum(VALID_CATEGORIES),
  urgency: z.enum(VALID_URGENCIES),
  translatedText: z.string().nullable(),
  summary: z.string(),
});

// Cache token to prevent generating a new token for every request if they happen close together
let cachedToken: { token: string; expires: number } | null = null;

async function getVertexAccessToken(saJsonStr: string): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60000) {
    return cachedToken.token;
  }
  
  const trimmed = saJsonStr.trim();
  const decodedCreds = (trimmed.startsWith("{") || trimmed.startsWith("'") || trimmed.startsWith('"'))
    ? trimmed.replace(/^['"]|['"]$/g, "")
    : atob(trimmed);
  const sa = JSON.parse(decodedCreds);
  const privateKey = await jose.importPKCS8(sa.private_key, "RS256");

  const jwt = await new jose.SignJWT({
    scope: "https://www.googleapis.com/auth/cloud-platform"
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setIssuer(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setExpirationTime("1h")
    .sign(privateKey);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to get OAuth token: ${JSON.stringify(data)}`);
  }

  cachedToken = {
    token: data.access_token,
    expires: Date.now() + (data.expires_in || 3600) * 1000
  };

  return data.access_token;
}

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
- "matuling" / "kule matuling" = dark / black water (CHEMICAL_DISCOLORATION_CONTAMINATION)
- "dilo" / "kule dilo" / "kulasisi" = yellow / yellowish water (HIGH_MINERAL_CONTENT_TDS or HIGH_TURBIDITY)
- "malutu" / "kule malutu" = red / rust water
- "taya" / "kule taya" = brown / muddy water (HIGH_TURBIDITY)
- "mabau" / "mabaho" = smelly / bad odor (when smell is the primary complaint with no discoloration → CHEMICAL_DISCOLORATION_CONTAMINATION)
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

Urgency scoring rules:
- CRITICAL: complete loss of water supply (no water / dry faucet), especially lasting more than 24 hours, or suspected chemical contamination posing an immediate health risk.
- HIGH: severely reduced pressure or weak flow, an active/visible leak or burst pipe, black or severely darkened water, or a strong chemical/rotten odor.
- MEDIUM: yellow, brown, or muddy discoloration, a noticeable but not severe pressure drop, or a minor quality issue while water is still usable.
- LOW: minor or cosmetic issue with no service impact.

Unknown-word handling:
- These Kapampangan terms are common; you may encounter others. Use your general knowledge of Kapampangan, Tagalog, and Taglish to translate any term not listed here.
- If the overall meaning is clear, classify it accordingly even if one word is unfamiliar.
- Only use UNCLASSIFIED_INFRASTRUCTURE_ANOMALY when the report's meaning cannot be confidently determined.

Spelling / fragment handling:
- Elders and texters may misspell or abbreviate words (e.g. "tubg" = "tubig", "ala dnum" = "alang danum", "mabah" = "mabaho").
- Normalize phonetic and truncated variants to their intended meaning using context, and treat them as the correct term.
- A word written in either Tagalog or Kapampangan for the same concept should map to the same category (e.g. "walang tubig" and "alang danum" both mean no water).

Confidence scoring:
- confidenceScore is an integer 0-100 expressing how certain you are of the classification and translation.
- Use high values (90+) for clear, well-known terms; moderate (75-89) when words are unfamiliar or misspelled but the meaning is clear; lower only when the meaning is genuinely ambiguous.

Few-shot examples (complete valid JSON outputs):
- Report: "Alang danum keni, marang ing gripo" -> { "category": "PIPELINE_BREACH_PRESSURE_DROP", "urgency": "CRITICAL", "translatedText": "There is no water here, the faucet is dry.", "summary": "The resident reports a complete loss of water supply with a dry faucet.", "probableRootCause": "Intermediary Pipeline Breach (Low Water Pressure Breach)", "recommendedAction": "Dispatch crew to inspect pipeline segment for physical leaks.", "confidenceScore": 95 }
- Report: "ala dnum keni" (fragment of "alang danum keni") -> { "category": "PIPELINE_BREACH_PRESSURE_DROP", "urgency": "CRITICAL", "translatedText": "There is no water here.", "summary": "The resident reports no water supply.", "probableRootCause": "Intermediary Pipeline Breach (Low Water Pressure Breach)", "recommendedAction": "Dispatch crew to inspect pipeline segment for physical leaks.", "confidenceScore": 88 }
- Report: "Matuling ing danum keng gripo" -> { "category": "CHEMICAL_DISCOLORATION_CONTAMINATION", "urgency": "HIGH", "translatedText": "The water from the faucet is black.", "summary": "The resident reports black water coming from the faucet.", "probableRootCause": "Localized Pipe Contamination (pH Level Deviation / Discoloration)", "recommendedAction": "Isolate local pipeline segment and treat water source.", "confidenceScore": 90 }
- Report: "Kule dilo ing danum, maalat ya" -> { "category": "HIGH_MINERAL_CONTENT_TDS", "urgency": "MEDIUM", "translatedText": "The water is yellow and salty.", "summary": "The resident reports yellowish, salty water.", "probableRootCause": "Localized Pipe Mineral Leaching (High Mineral Content (TDS Exceeded))", "recommendedAction": "Inspect filtration systems and run chemical composition analysis.", "confidenceScore": 92 }

Translate the report to English, assign category, urgency (LOW, MEDIUM, HIGH, CRITICAL), summary (1 sentence), probableRootCause, recommendedAction, and confidenceScore based on the rules above.`;

    let oauthToken = "";
    let usingVertex = false;
    let project = "";
    let location = "";

    if (GOOGLE_VERTEX_CREDENTIALS) {
      try {
        oauthToken = await getVertexAccessToken(GOOGLE_VERTEX_CREDENTIALS);
        const trimmed = GOOGLE_VERTEX_CREDENTIALS.trim();
        const decodedCreds = (trimmed.startsWith("{") || trimmed.startsWith("'") || trimmed.startsWith('"'))
          ? trimmed.replace(/^['"]|['"]$/g, "")
          : atob(trimmed);
        const sa = JSON.parse(decodedCreds);
        project = sa.project_id || Deno.env.get("GOOGLE_VERTEX_PROJECT") || "aquatrack-prod";
        location = Deno.env.get("GOOGLE_VERTEX_LOCATION") || "us-central1";
        usingVertex = true;
      } catch (err) {
        console.error("[Triage Edge Function] Vertex auth failed, falling back to AI Studio:", (err as Error).message);
      }
    }

    const modelIds = ["gemini-3.7-flash", "gemini-3.5-flash-lite"];

    let result: {
      category: string;
      urgency: string;
      translatedText?: string;
      summary: string;
      probableRootCause: string;
      confidenceScore?: number;
      recommendedAction: string;
    } | null = null;

    for (const modelId of modelIds) {
      const url = usingVertex
        ? `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${modelId}:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${GEMINI_API_KEY}`;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (usingVertex && oauthToken) {
        headers["Authorization"] = `Bearer ${oauthToken}`;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout
        const aiResponse = await fetch(url, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Report: "${complaint.rawText}"\nNearby Sensor: ${contextNode ? JSON.stringify(contextNode) : "None"}` }] }],
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
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
        clearTimeout(timeoutId);

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

        if (!aiJson.candidates[0]?.content?.parts?.[0]) {
          throw new Error("Gemini returned no valid response candidates");
        }

        const resultText = aiJson.candidates[0].content.parts[0].text;
        const parsedResult = JSON.parse(resultText);

        parsedResult.category = normalizeCategory(parsedResult.category);
        parsedResult.urgency = normalizeUrgency(parsedResult.urgency);
        if (parsedResult.translatedText == null) parsedResult.translatedText = null;

        const validated = triageResultSchema.safeParse(parsedResult);
        if (!validated.success) {
          throw new Error(`Invalid triage schema: ${validated.error.issues.map((i) => i.message).join("; ")}`);
        }

        result = parsedResult;
        break;
      } catch (err) {
        if (modelId === modelIds[modelIds.length - 1]) {
          throw err;
        }
        console.error(`Gemini model ${modelId} failed, trying fallback: ${(err as Error).message}`);
      }
    }

    if (!result) {
      throw new Error("All triage models failed");
    }

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
          complaintId,
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