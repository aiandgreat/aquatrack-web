import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (fromParam && toParam) {
      startDate = new Date(fromParam);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate = new Date(toParam);
      endDate.setUTCHours(23, 59, 59, 999);
    }

    const nodes = await prisma.telemetryNode.findMany({
      orderBy: { name: "asc" },
      include: {
        readings: {
          orderBy: { timestamp: "desc" },
          take: 1, // Only load 1 latest row per node for fallback
        },
      },
    });

    let averagesMap: Record<string, { ph: number; turbidity: number; tds: number; pressure: number }> = {};

    if (startDate && endDate) {
      const averages = await prisma.telemetryReading.groupBy({
        by: ["nodeId"],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _avg: {
          ph: true,
          turbidity: true,
          tds: true,
          pressure: true,
        },
      });

      averages.forEach((avg) => {
        if (avg._avg.ph !== null) {
          averagesMap[avg.nodeId] = {
            ph: avg._avg.ph,
            turbidity: avg._avg.turbidity ?? 1.5,
            tds: avg._avg.tds ?? 235,
            pressure: avg._avg.pressure ?? 40.0,
          };
        }
      });
    }

    // Format geom fields or exclude them to avoid circular references/issues in JSON serialization
    const serializedNodes = nodes.map(n => {
      // If filtering dates and averages exist for this node, use them
      if (startDate && endDate && averagesMap[n.id]) {
        const avg = averagesMap[n.id];
        return {
          id: n.id,
          name: n.name,
          type: n.type,
          latitude: n.latitude,
          longitude: n.longitude,
          status: n.status,
          reading: {
            ph: parseFloat(avg.ph.toFixed(2)),
            turbidity: parseFloat(avg.turbidity.toFixed(2)),
            tds: Math.round(avg.tds),
            pressure: parseFloat(avg.pressure.toFixed(1)),
            timestamp: endDate!.toISOString(),
          },
        };
      }

      // Default: latest reading
      const latest = n.readings[0] || null;
      return {
        id: n.id,
        name: n.name,
        type: n.type,
        latitude: n.latitude,
        longitude: n.longitude,
        status: n.status,
        reading: latest ? {
          ph: latest.ph,
          turbidity: latest.turbidity,
          tds: latest.tds,
          pressure: latest.pressure,
          timestamp: latest.timestamp,
        } : null,
      };
    });
    return NextResponse.json({ success: true, nodes: serializedNodes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    if (!id || !status) {
      return NextResponse.json({ error: "Missing node ID or status" }, { status: 400 });
    }

    const updatedNode = await prisma.telemetryNode.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      node: {
        id: updatedNode.id,
        name: updatedNode.name,
        type: updatedNode.type,
        latitude: updatedNode.latitude,
        longitude: updatedNode.longitude,
        status: updatedNode.status,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
