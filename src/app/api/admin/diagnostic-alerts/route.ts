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
    const { id, status, crewId, complaintId, emailAlertsEnabled } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Update the DiagnosticAlert status
    const updated = await prisma.diagnosticAlert.update({
      where: { id },
      data: { status },
    });

    // 2. If a technician and a specific complaint were provided, assign only that complaint
    if (crewId && complaintId) {
      const complaint = await prisma.complaint.findUnique({
        where: { id: complaintId },
        select: { id: true, userId: true, category: true, summary: true, urgency: true, assignedToId: true },
      });

      if (complaint) {
        // Assign the technician and set status to DISPATCHED for this specific complaint
        await prisma.complaint.update({
          where: { id: complaintId },
          data: { assignedToId: crewId, status: "DISPATCHED" },
        });

        // Fire notifications (fire-and-forget)
        try {
          const { sendFcmNotification } = await import("../../../../lib/fcm-sender");

          const technician = await prisma.user.findUnique({
            where: { id: crewId },
            select: { pushToken: true, email: true, name: true },
          });

          const ticketName = complaint.summary || complaint.category || "Reported Issue";

          // Notify the resident that their ticket is now dispatched
          if (complaint.userId) {
            const resident = await prisma.user.findUnique({
              where: { id: complaint.userId },
              select: { pushToken: true },
            });
            if (resident?.pushToken) {
              await sendFcmNotification(
                [resident.pushToken],
                "AquaTrack Alert: Ticket Update",
                `The status of your ticket regarding "${ticketName}" has been updated to: DISPATCHED 🚒.`,
                { type: "complaint_status", complaintId: complaint.id, status: "DISPATCHED" }
              );
            }
          }

          // Notify the technician of the new assignment
          if (technician?.pushToken) {
            await sendFcmNotification(
              [technician.pushToken],
              "🚨 CSFWD Operation Dispatch",
              `New emergency assignment: "${ticketName}". Please open your Technician Console to review details.`,
              { type: "new_assignment", complaintId: complaint.id }
            );
          }

          // Send Brevo email to the technician
          if (emailAlertsEnabled !== false && technician?.email) {
            const { sendReactEmailNotification } = await import("../../../../lib/resend");
            await sendReactEmailNotification(
              technician.email,
              `New Incident Assignment - ${ticketName}`,
              {
                crewName: technician.name,
                incidentId: `AQ-${complaint.id.slice(0, 8).toUpperCase()}`,
                urgency: complaint.urgency || "MEDIUM",
                description: complaint.summary || complaint.category || "Reported water district anomaly.",
              }
            );
          }
        } catch (notifErr) {
          console.error("[DIAGNOSTIC-ALERTS API] Notification error:", notifErr);
        }
      }
    }

    return NextResponse.json({ success: true, alert: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
