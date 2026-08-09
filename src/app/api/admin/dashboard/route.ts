import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

/**
 * GET /api/admin/dashboard
 *
 * Combined initial-load endpoint for the admin dashboard.
 * Runs all 6 data queries in parallel server-side (one DB connection,
 * one HTTP round-trip) instead of the browser firing 6 separate fetches.
 *
 * Individual API routes remain unchanged and are still used by
 * Realtime callbacks and specific user interactions.
 */
export async function GET() {
  try {
    const [
      users,
      rawNodes,
      rawComplaints,
      advisories,
      alerts,
      statsData,
    ] = await Promise.all([
      // Users
      prisma.user.findMany({ orderBy: { name: "asc" } }),

      // Nodes with latest reading
      prisma.telemetryNode.findMany({
        orderBy: { name: "asc" },
        include: {
          readings: {
            orderBy: { timestamp: "desc" },
            take: 1,
          },
        },
      }),

      // Complaints (raw SQL for PostGIS lat/lng extraction)
      prisma.$queryRaw<any[]>`
        SELECT
          c.id,
          c."rawText",
          c."translatedText",
          c.summary,
          c.urgency,
          c.category,
          c.status,
          c."aiStatus",
          c."imageUrl",
          c."createdAt",
          c."assignedToId",
          c.barangay,
          u.name AS "userName",
          u.email AS "userEmail",
          u."serviceAccountNo" AS "serviceAccountNo",
          tech.name AS "assignedToName",
          ST_X(c.geom) AS longitude,
          ST_Y(c.geom) AS latitude
        FROM "Complaint" c
        LEFT JOIN "User" u ON c."userId" = u.id
        LEFT JOIN "User" tech ON c."assignedToId" = tech.id
        ORDER BY c."createdAt" DESC
      `,

      // Advisories
      prisma.advisory.findMany({ orderBy: { createdAt: "desc" } }),

      // Diagnostic alerts (PENDING + ONGOING only)
      prisma.diagnosticAlert.findMany({
        where: { status: { in: ["PENDING", "ONGOING"] } },
        include: {
          node: { select: { name: true, latitude: true, longitude: true } },
        },
        orderBy: { createdAt: "desc" },
      }),

      // Stats aggregations
      Promise.all([
        prisma.user.count(),
        prisma.telemetryNode.count({ where: { status: "ONLINE" } }),
        prisma.telemetryNode.count(),
        prisma.complaint.count({
          where: { status: { in: ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"] } },
        }),
        prisma.telemetryReading.aggregate({
          _avg: { ph: true, turbidity: true, tds: true, pressure: true },
          where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
      ]),
    ]);

    // Serialize nodes
    const nodes = rawNodes.map((n) => {
      const latest = n.readings[0] || null;
      return {
        id: n.id,
        name: n.name,
        type: n.type,
        latitude: n.latitude,
        longitude: n.longitude,
        status: n.status,
        reading: latest
          ? {
              ph: latest.ph,
              turbidity: latest.turbidity,
              tds: latest.tds,
              pressure: latest.pressure,
              timestamp: latest.timestamp,
            }
          : null,
      };
    });

    // Serialize complaints
    const complaints = rawComplaints.map((c: any) => ({
      id: c.id,
      rawText: c.rawText,
      translatedText: c.translatedText || "",
      summary: c.summary || "Resident reported issue",
      latitude: Number(c.latitude),
      longitude: Number(c.longitude),
      urgency: c.urgency?.toString() || "MEDIUM",
      category: c.category?.toString() || "UNCLASSIFIED_INFRASTRUCTURE_ANOMALY",
      status: c.status.toString(),
      aiStatus: c.aiStatus.toString(),
      imageUrl: c.imageUrl || "",
      createdAt: new Date(c.createdAt).toISOString(),
      assignedToId: c.assignedToId || null,
      assignedToName: c.assignedToName || null,
      barangay: c.barangay || "",
      userName: c.userName || "Anonymous Resident",
      userEmail: c.userEmail || "",
      serviceAccountNo: c.serviceAccountNo || "",
    }));

    // Serialize diagnostic alerts
    const formattedAlerts = alerts.map((a: any) => {
      let analysis = a.geminiAnalysis;
      if (typeof analysis === "string") {
        try { analysis = JSON.parse(analysis); } catch { /* ignore */ }
      }
      let score = analysis?.confidenceScore || 80;
      if (score > 0 && score <= 1) score = Math.round(score * 100);
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
          recommendedAction: analysis?.recommendedAction || "Inspect sensor node.",
          rootCauseAnalysis: analysis?.rootCauseAnalysis || "",
        },
      };
    });

    // Unpack stats
    const [totalUsers, onlineNodes, totalNodes, unresolvedComplaints, readingAverages] = statsData;
    const avgPh = readingAverages._avg.ph ?? 7.2;
    const avgTurbidity = readingAverages._avg.turbidity ?? 1.8;
    const avgTds = readingAverages._avg.tds ?? 240;
    const avgPressure = readingAverages._avg.pressure ?? 44.0;

    return NextResponse.json({
      success: true,
      users,
      nodes,
      complaints,
      advisories,
      alerts: formattedAlerts,
      stats: {
        totalUsers,
        onlineNodes,
        totalNodes,
        unresolvedComplaints,
        complianceIndex: 0,
        avgPh: parseFloat(avgPh.toFixed(2)),
        avgTurbidity: parseFloat(avgTurbidity.toFixed(2)),
        avgTds: Math.round(avgTds),
        avgPressure: parseFloat(avgPressure.toFixed(2)),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
