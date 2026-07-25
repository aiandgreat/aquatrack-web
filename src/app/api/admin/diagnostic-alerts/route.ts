import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    const alerts = await prisma.diagnosticAlert.findMany({
      where: {
        status: { in: ["PENDING", "ONGOING"] }
      },
      include: {
        node: {
          select: {
            name: true,
            latitude: true,
            longitude: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Format fields for frontend compatibility
    const formatted = alerts.map((a: any) => {
      let analysis = a.geminiAnalysis;
      if (typeof analysis === "string") {
        try {
          analysis = JSON.parse(analysis);
        } catch {
          // ignore parsing error
        }
      }

      let score = analysis?.confidenceScore || 80;
      // Convert decimal scores (like 0.95) to percentage values (95)
      if (score > 0 && score <= 1) {
        score = Math.round(score * 100);
      }

      return {
        id: a.id,
        nodeId: a.nodeId,
        complaintCount: a.complaintCount,
        status: a.status,
        createdAt: a.createdAt,
        node: a.node,
        geminiAnalysis: {
          probableRootCause: analysis?.probableRootCause || "Unknown pipe breach",
          confidenceScore: score,
          recommendedAction: analysis?.recommendedAction || "Inspect node valves",
          rootCauseAnalysis: analysis?.rootCauseAnalysis || "Threshold breach detected."
        }
      };
    });

    return NextResponse.json({ success: true, alerts: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const updated = await prisma.diagnosticAlert.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
