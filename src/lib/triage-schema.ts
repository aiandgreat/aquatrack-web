import { z } from "zod";

export const complaintTriageSchema = z.object({
  category: z.enum([
    "PIPELINE_BREACH_PRESSURE_DROP",
    "HIGH_TURBIDITY",
    "HIGH_MINERAL_CONTENT_TDS",
    "CHEMICAL_DISCOLORATION_CONTAMINATION",
    "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY"
  ]),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  translatedText: z.string().nullable().describe("Clean English translation of rawText, or null if input text is English prose."),
  summary: z.string().describe("A single, descriptive sentence highlighting the primary physical water issue.")
});
