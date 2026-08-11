import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";

/**
 * POST /api/triage
 *
 * Example of Vercel AI SDK + Google Gemini integration for Next.js server environment.
 * Parses a citizen complaint and returns structured classification results.
 */
export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing Gemini API key configurations" }, { status: 500 });
    }

    // Configure Gemini model using Vercel AI SDK custom provider
    const googleProvider = createGoogle({ apiKey });
    const model = googleProvider("gemini-3.5-flash-lite");

    const { text: aiResponse } = await generateText({
      model,
      temperature: 0.0,
      prompt: `You are an AI engineer for a municipal water district. Analyze this citizen complaint: "${text}".
      
      Instruction: The report may be written in English, Tagalog, Taglish, or Kapampangan dialect. Use this Kapampangan translation guide to translate accurately to English:
      - "danum" = water
      - "kayna" / "mayna" / "kumayna" / "mababa agus" = weak water flow / low water pressure / slow flow of water
      - "ala danum" / "alang danum" / "marang" = no water / dry faucet (maps to PIPELINE_BREACH_PRESSURE_DROP, high urgency)
      - "matuling" / "kule matuling" = black / dark water (highly critical, maps to CHEMICAL_DISCOLORATION_CONTAMINATION or HIGH_TURBIDITY)
      - "dilo" / "kule dilo" / "kulasisi" = yellow / yellowish water (maps to HIGH_MINERAL_CONTENT_TDS or HIGH_TURBIDITY)
      - "malutu" / "kule malutu" = red / reddish / rusty water
      - "taya" / "kule taya" = brown / muddy water
      - "malino" = clear water
      - "keni" / "keti" = here
      - "karin" / "keta" = there
      - "mabau" = smelly / bad odor
      - "agus" = flow / stream
      - "gripo" = faucet / tap
      
      Additional context: "Sobrang kayna ing danum keni" translates to "The water flow/pressure here is extremely weak."
      
      Translate it accurately to English, capturing all details including water discoloration, flow, and duration.
      
      Return ONLY a raw JSON object matching this schema:
      {
        "category": "PIPELINE_BREACH_PRESSURE_DROP" | "HIGH_TURBIDITY" | "HIGH_MINERAL_CONTENT_TDS" | "CHEMICAL_DISCOLORATION_CONTAMINATION" | "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
        "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "translatedText": "string (English translation)",
        "summary": "string (one-sentence summary)"
      }`,
    });

    // Clean JSON markdown block markers if returned
    const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Vercel AI SDK Triage Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
