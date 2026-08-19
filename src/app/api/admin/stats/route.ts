import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET() {
  try {
    // Query counts and telemetry averages in parallel to optimize latency
    const [totalUsers, onlineNodes, totalNodes, unresolvedComplaints, readingAverages, totalReadingsCount, stableReadingsCount] = await Promise.all([
      prisma.user.count(),
      prisma.telemetryNode.count({
        where: { status: "ONLINE" },
      }),
      prisma.telemetryNode.count(),
      prisma.complaint.count({
        where: {
          status: {
            in: ["PENDING", "EVALUATING", "DISPATCHED", "ONGOING"],
          },
        },
      }),
      prisma.telemetryReading.aggregate({
        _avg: {
          ph: true,
          turbidity: true,
          tds: true,
          pressure: true
        },
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // past 24 hours
          }
        }
      }),
      prisma.telemetryReading.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.telemetryReading.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          },
          ph: { gte: 6.5, lte: 8.5 },
          turbidity: { lte: 5.0 },
          tds: { lte: 500 }
        }
      })
    ]);

    const avgPh = readingAverages._avg.ph ?? 7.2;
    const avgTurbidity = readingAverages._avg.turbidity ?? 1.8;
    const avgTds = readingAverages._avg.tds ?? 240;
    const avgPressure = readingAverages._avg.pressure ?? 44.0;

    const complianceIndex = totalReadingsCount > 0
      ? Math.round((stableReadingsCount / totalReadingsCount) * 100)
      : 100;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        onlineNodes,
        totalNodes,
        unresolvedComplaints,
        complianceIndex,
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
