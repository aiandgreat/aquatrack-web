import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";

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

    const googleProvider = createGoogle({ apiKey });
    const model = googleProvider("gemini-3.5-flash-lite");

    const { text: aiResponse } = await generateText({
      model,
      temperature: 0.0,
      prompt: `You are an AI engineer for a municipal water district. Analyze this citizen complaint: "${text}".
      
      Instruction: The report may be written in English, Tagalog, Taglish, or Kapampangan dialect. Use this Kapampangan translation guide to translate accurately to English:
      - "danum" = water
      - "kayna" / "mayna" / "kumayna" / "mababa agus" = weak water flow / low water pressure
      - "ala danum" / "alang danum" / "marang" = no water / dry faucet (PIPELINE_BREACH_PRESSURE_DROP, high urgency)
      - "matuling" / "kule matuling" = dark water (CHEMICAL_DISCOLORATION_CONTAMINATION or HIGH_TURBIDITY)
      - "dilo" / "kule dilo" / "kulasisi" = yellow / yellowish water (HIGH_MINERAL_CONTENT_TDS or HIGH_TURBIDITY)
      - "malutu" / "kule malutu" = red / rust water
      - "taya" / "kule taya" = brown / muddy water (HIGH_TURBIDITY)
      - "malino" = clear water
      - "mabau" = smelly / bad odor
      
      Additional context: "Sobrang kayna ing danum keni" translates to "The water flow/pressure here is extremely weak."
      
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
      
      Return ONLY a raw JSON object matching this schema:
      {
        "category": "PIPELINE_BREACH_PRESSURE_DROP" | "HIGH_TURBIDITY" | "HIGH_MINERAL_CONTENT_TDS" | "CHEMICAL_DISCOLORATION_CONTAMINATION" | "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
        "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "translatedText": "string (English translation)",
        "summary": "string (one-sentence summary)",
        "probableRootCause": "string (strictly match mapping rules above)",
        "recommendedAction": "string (strictly match mapping rules above)"
      }`,
    });

    const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Vercel AI SDK Triage Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}