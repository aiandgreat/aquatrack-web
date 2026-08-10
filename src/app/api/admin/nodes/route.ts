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
          where: startDate && endDate ? {
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          } : undefined,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    // Format geom fields or exclude them to avoid circular references/issues in JSON serialization
    const serializedNodes = nodes.map(n => {
      // If filtering dates, average all readings in that range
      if (startDate && endDate && n.readings.length > 0) {
        const group = n.readings;
        const avgPh = group.reduce((sum, r) => sum + r.ph, 0) / group.length;
        const avgTurbidity = group.reduce((sum, r) => sum + r.turbidity, 0) / group.length;
        const avgTds = group.reduce((sum, r) => sum + r.tds, 0) / group.length;
        const avgPressure = group.reduce((sum, r) => sum + r.pressure, 0) / group.length;

        return {
          id: n.id,
          name: n.name,
          type: n.type,
          latitude: n.latitude,
          longitude: n.longitude,
          status: n.status,
          reading: {
            ph: parseFloat(avgPh.toFixed(2)),
            turbidity: parseFloat(avgTurbidity.toFixed(2)),
            tds: Math.round(avgTds),
            pressure: parseFloat(avgPressure.toFixed(1)),
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
