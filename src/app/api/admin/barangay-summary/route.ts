import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateText } from "ai";
import { createGoogle } from "@ai-sdk/google";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const barangay = searchParams.get("barangay");

    if (!barangay) {
      return NextResponse.json({ error: "Missing barangay parameter" }, { status: 400 });
    }

    // Fetch all complaints in this barangay
    const complaints = await prisma.complaint.findMany({
      where: { barangay },
      select: { rawText: true, urgency: true, category: true },
    });

    if (complaints.length === 0) {
      return NextResponse.json({
        success: true,
        summary: "No complaints have been reported in this barangay. Water service is operating under normal parameters.",
        status: "NORMAL"
      });
    }

    let summary = "";
    let status = "LOW_RISK";

    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing Gemini API key configurations");
      }

      const googleProvider = createGoogle({ apiKey });
      const model = googleProvider("gemini-3.5-flash");

      const prompt = `You are a municipal utility analyst. Here is a list of citizen complaints for Barangay ${barangay} in San Fernando, Pampanga:
${complaints.map((c, i) => `${i + 1}. [Urgency: ${c.urgency}, Category: ${c.category}] "${c.rawText}"`).join("\n")}

Based on the complaints list, return ONLY a raw JSON object matching this schema:
{
  "summary": "a short 2-sentence summary of the main issues (e.g. pressure drops, discolored water) and their impact",
  "status": "CRITICAL" | "MODERATE" | "LOW_RISK"
}`;

      const { text: aiResponse } = await generateText({
        model,
        prompt,
      });

      const cleanJson = aiResponse.replace(/```json|```/g, "").trim();
      const result = JSON.parse(cleanJson);
      summary = result.summary;
      status = result.status;
    } catch (aiErr) {
      console.warn("Gemini AI summary generation failed, running smart fallback:", aiErr);

      // Smart Rule-based Fallback
      const total = complaints.length;
      const criticalCount = complaints.filter((c) => c.urgency === "CRITICAL").length;
      const highCount = complaints.filter((c) => c.urgency === "HIGH").length;

      // Clean category names for rendering
      const categories = complaints.map((c) => c.category.replace(/_/g, " ").toLowerCase());
      const uniqueCategories = Array.from(new Set(categories));

      status = criticalCount > 0 ? "CRITICAL" : highCount > 0 ? "MODERATE" : "LOW_RISK";
      summary = `Sector has ${total} active report${total !== 1 ? "s" : ""} highlighting ${uniqueCategories.join(" and ")}. There are ${criticalCount} critical and ${highCount} high-urgency reports under evaluation.`;
    }

    return NextResponse.json({
      success: true,
      summary,
      status,
    });
  } catch (err: any) {
    console.error("Barangay summary API error:", err);
    return NextResponse.json({ error: err.message }, { status: 550 });
  }
}
