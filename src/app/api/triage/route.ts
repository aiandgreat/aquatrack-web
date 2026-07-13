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
    const model = googleProvider("gemini-3.1-flash-lite");

    const { text: aiResponse } = await generateText({
      model,
      temperature: 0.1,
      prompt: `You are an AI engineer for a municipal water district. Analyze this citizen complaint: "${text}".
      
      Instruction: The report may be written in English, Tagalog, Taglish, or Kapampangan dialect (e.g., "kule dilo" refers to yellow color, "ala danum" refers to no water/low pressure). Translate it accurately to English, capturing all details including water discoloration, flow, and duration.
      
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
