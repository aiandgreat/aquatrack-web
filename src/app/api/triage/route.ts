import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { redis } from "../../../lib/redis";
import { complaintTriageSchema } from "../../../lib/triage-schema";

const VALID_CATEGORIES = [
  "PIPELINE_BREACH_PRESSURE_DROP",
  "HIGH_TURBIDITY",
  "HIGH_MINERAL_CONTENT_TDS",
  "CHEMICAL_DISCOLORATION_CONTAMINATION",
  "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
];

const VALID_URGENCIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const FLASH_COOLDOWN_KEY = "triage:flash_cooldown_until";
const MIN_COOLDOWN_SECONDS = 5;
const MAX_COOLDOWN_SECONDS = 120;
const DEFAULT_COOLDOWN_SECONDS = 60;
const memoryCooldownUntil = new Map<string, number>();

function isQuotaError(err: any): boolean {
  const message = String(err?.message || err || "");
  return /quota|429|rate.?limit|resource.?exhausted|too many requests/i.test(message);
}

function parseRetrySeconds(message: string): number {
  const match = message.match(/retry in\s+([\d.]+)\s*s/i);
  if (!match) return DEFAULT_COOLDOWN_SECONDS;
  const seconds = Math.ceil(parseFloat(match[1]));
  return Math.min(Math.max(seconds, MIN_COOLDOWN_SECONDS), MAX_COOLDOWN_SECONDS);
}

async function isFlashInCooldown(): Promise<boolean> {
  const memUntil = memoryCooldownUntil.get(FLASH_COOLDOWN_KEY) || 0;
  if (memUntil > Date.now()) return true;
  try {
    const until = await redis.get<string>(FLASH_COOLDOWN_KEY);
    if (until && Number(until) > Date.now()) {
      memoryCooldownUntil.set(FLASH_COOLDOWN_KEY, Number(until));
      return true;
    }
  } catch {
    // Redis unavailable: fail open (no cooldown) and rely on in-memory fallback
  }
  return false;
}

async function armCooldown(seconds: number): Promise<void> {
  const until = Date.now() + seconds * 1000;
  memoryCooldownUntil.set(FLASH_COOLDOWN_KEY, until);
  try {
    await redis.set(FLASH_COOLDOWN_KEY, until.toString(), { ex: seconds });
  } catch {
    // Redis unavailable: in-memory cooldown still applies
  }
}

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
    const models = [googleProvider("gemini-3.5-flash-lite")];

    let finalResult: any;
    const startIndex = 0;

    for (let i = startIndex; i < models.length; i++) {
      const model = models[i];
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        const result = await generateText({
          model,
          temperature: 0.0,
          maxRetries: 0, // Fail fast, jump to fallback immediately
          abortSignal: controller.signal,
          system: `You are an AI engineer for a municipal water district.
      
      Instruction: The report may be written in English, Tagalog, Taglish, or Kapampangan dialect. Use this Kapampangan translation guide to translate accurately to English:
      - "danum" = water
      - "kayna" / "mayna" / "kumayna" / "mababa agus" = weak water flow / low water pressure
      - "ala danum" / "alang danum" / "marang" = no water / dry faucet (PIPELINE_BREACH_PRESSURE_DROP, high urgency)
      - "matuling" / "kule matuling" = dark / black water (CHEMICAL_DISCOLORATION_CONTAMINATION)
      - "dilo" / "kule dilo" / "kulasisi" = yellow / yellowish water (HIGH_MINERAL_CONTENT_TDS or HIGH_TURBIDITY)
      - "malutu" / "kule malutu" = red / rust water
      - "taya" / "kule taya" = brown / muddy water (HIGH_TURBIDITY)
      - "malino" = clear water
      - "mabau" / "mabaho" = smelly / bad odor (when smell is the primary complaint with no discoloration → CHEMICAL_DISCOLORATION_CONTAMINATION)
      
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

      Return ONLY a raw JSON object matching this schema:
      {
        "category": "PIPELINE_BREACH_PRESSURE_DROP" | "HIGH_TURBIDITY" | "HIGH_MINERAL_CONTENT_TDS" | "CHEMICAL_DISCOLORATION_CONTAMINATION" | "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
        "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
        "translatedText": "string (English translation)",
        "summary": "string (one-sentence summary)",
        "probableRootCause": "string (strictly match mapping rules above)",
        "recommendedAction": "string (strictly match mapping rules above)",
        "confidenceScore": "integer 0-100 (how certain you are of this classification)"
      }`,
          prompt: `Citizen complaint: "${text}"`,
        });
        clearTimeout(timeoutId);
        const cleanJson = result.text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleanJson);

        parsed.category = normalizeCategory(parsed.category);
        parsed.urgency = normalizeUrgency(parsed.urgency);
        if (parsed.translatedText == null) parsed.translatedText = null;

        const validated = complaintTriageSchema.safeParse(parsed);
        if (!validated.success) {
          throw new Error(`Invalid triage schema: ${validated.error.issues.map((i) => i.message).join("; ")}`);
        }

        finalResult = parsed;
        break;
      } catch (err: any) {
        if (model === models[models.length - 1]) throw err;
        if (isQuotaError(err)) {
          await armCooldown(parseRetrySeconds(String(err?.message || "")));
          console.error("Flash quota exhausted, arming cooldown and falling back:", err.message);
        } else {
          console.error("Triage model failed, trying fallback:", err.message);
        }
      }
    }

    if (!finalResult) {
      return NextResponse.json({ error: "All triage models failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, result: finalResult });
  } catch (err: any) {
    console.error("Vercel AI SDK Triage Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}