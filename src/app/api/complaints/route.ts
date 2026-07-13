import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SAN_FERNANDO_BARANGAYS = [
  "Alasas", "Baliti", "Bulaon", "Calulut", "Del Carmen", "Del Pilar",
  "Del Rosario", "Dela Paz Norte", "Dela Paz Sur", "Dolores", "Juliana",
  "Lara", "Lourdes", "Magliman", "Maimpis", "Malino", "Malpitic",
  "Pandaras", "Panipuan", "Pulung Bulu", "Quebiawan", "Saguin",
  "San Agustin", "San Felipe", "San Isidro", "San Jose", "San Juan",
  "San Nicolas", "San Pedro Cutud", "Santa Lucia", "Santa Teresita",
  "Santo Niño", "Santo Rosario", "Sindalan", "Telabastagan",
];

function normalizeBarangayName(raw: string): string | null {
  if (!raw) return null;
  let cleaned = raw
    .replace(/^barangay\s+/i, "")
    .replace(/^brgy\.?\s+/i, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .trim();
  const direct = SAN_FERNANDO_BARANGAYS.find(
    (b) => b.toLowerCase() === cleaned.toLowerCase()
  );
  if (direct) return direct;
  const partial = SAN_FERNANDO_BARANGAYS.find(
    (b) =>
      raw.toLowerCase().includes(b.toLowerCase()) ||
      b.toLowerCase().includes(cleaned.toLowerCase())
  );
  return partial ?? null;
}

async function nominatimLookup(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${latitude}&lon=${longitude}&format=json&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AquaTrack-CSFWD/1.0 (aquatrack@csfwd.gov.ph)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address ?? {};
    const candidates = [
      addr.village, addr.suburb, addr.neighbourhood,
      addr.quarter, addr.city_district, addr.hamlet, addr.residential,
      addr.town, addr.city, addr.municipality,
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const matched = normalizeBarangayName(candidate);
      if (matched) return matched;
      
      const cleaned = candidate.trim();
      if (cleaned.length > 2) {
        return cleaned;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Server-side PostGIS nearest-neighbor barangay detection (fallback only).
 * Uses ST_Distance with geography cast for accurate meter-based distance.
 * Returns null if the nearest centroid is >5 km away (outside San Fernando).
 */
async function detectBarangayFromCoords(longitude: number, latitude: number): Promise<{ barangay: string; distanceMeters: number } | null> {
  try {
    const result = await pool.query(`
      SELECT name, ST_Distance(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        centroid::geography
      ) AS distance_meters
      FROM (VALUES
        ('Alasas',          ST_SetSRID(ST_MakePoint(120.6723, 15.0612), 4326)),
        ('Baliti',          ST_SetSRID(ST_MakePoint(120.6830, 15.0540), 4326)),
        ('Bulaon',          ST_SetSRID(ST_MakePoint(120.6624, 15.0388), 4326)),
        ('Calulut',         ST_SetSRID(ST_MakePoint(120.6955, 15.0298), 4326)),
        ('Del Carmen',      ST_SetSRID(ST_MakePoint(120.6870, 15.0310), 4326)),
        ('Del Pilar',       ST_SetSRID(ST_MakePoint(120.6942, 15.0285), 4326)),
        ('Del Rosario',     ST_SetSRID(ST_MakePoint(120.6903, 15.0265), 4326)),
        ('Dela Paz Norte',  ST_SetSRID(ST_MakePoint(120.6758, 15.0502), 4326)),
        ('Dela Paz Sur',    ST_SetSRID(ST_MakePoint(120.6762, 15.0478), 4326)),
        ('Dolores',         ST_SetSRID(ST_MakePoint(120.6797, 15.0333), 4326)),
        ('Juliana',         ST_SetSRID(ST_MakePoint(120.6810, 15.0610), 4326)),
        ('Lara',            ST_SetSRID(ST_MakePoint(120.6680, 15.0440), 4326)),
        ('Lourdes',         ST_SetSRID(ST_MakePoint(120.6720, 15.0405), 4326)),
        ('Magliman',        ST_SetSRID(ST_MakePoint(120.6820, 15.0230), 4326)),
        ('Maimpis',         ST_SetSRID(ST_MakePoint(120.6863, 15.0355), 4326)),
        ('Malino',          ST_SetSRID(ST_MakePoint(120.6900, 15.0555), 4326)),
        ('Malpitic',        ST_SetSRID(ST_MakePoint(120.6935, 15.0490), 4326)),
        ('Pandaras',        ST_SetSRID(ST_MakePoint(120.6778, 15.0195), 4326)),
        ('Panipuan',        ST_SetSRID(ST_MakePoint(120.6840, 15.0160), 4326)),
        ('Pulung Bulu',     ST_SetSRID(ST_MakePoint(120.7020, 15.0420), 4326)),
        ('Quebiawan',       ST_SetSRID(ST_MakePoint(120.6960, 15.0580), 4326)),
        ('Saguin',          ST_SetSRID(ST_MakePoint(120.6888, 15.0248), 4326)),
        ('San Agustin',     ST_SetSRID(ST_MakePoint(120.6801, 15.0335), 4326)),
        ('San Felipe',      ST_SetSRID(ST_MakePoint(120.6735, 15.0272), 4326)),
        ('San Isidro',      ST_SetSRID(ST_MakePoint(120.6842, 15.0468), 4326)),
        ('San Jose',        ST_SetSRID(ST_MakePoint(120.6875, 15.0515), 4326)),
        ('San Juan',        ST_SetSRID(ST_MakePoint(120.6930, 15.0390), 4326)),
        ('San Nicolas',     ST_SetSRID(ST_MakePoint(120.6987, 15.0347), 4326)),
        ('San Pedro Cutud', ST_SetSRID(ST_MakePoint(120.6912, 15.0175), 4326)),
        ('Santa Lucia',     ST_SetSRID(ST_MakePoint(120.6748, 15.0323), 4326)),
        ('Santa Teresita',  ST_SetSRID(ST_MakePoint(120.6795, 15.0442), 4326)),
        ('Santo Niño',      ST_SetSRID(ST_MakePoint(120.6850, 15.0368), 4326)),
        ('Santo Rosario',   ST_SetSRID(ST_MakePoint(120.6920, 15.0302), 4326)),
        ('Sindalan',        ST_SetSRID(ST_MakePoint(120.6890, 15.0450), 4326)),
        ('Telabastagan',    ST_SetSRID(ST_MakePoint(120.6998, 15.0528), 4326))
      ) AS t(name, centroid)
      ORDER BY distance_meters ASC
      LIMIT 1;
    `, [longitude, latitude]);

    if (result.rows.length === 0) return null;
    const distanceMeters = Math.round(parseFloat(result.rows[0].distance_meters));
    if (distanceMeters > 50000) return null; // outside Pampanga test area
    return { barangay: result.rows[0].name, distanceMeters };
  } catch (err) {
    console.error("PostGIS barangay lookup failed:", err);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { rawText, latitude, longitude, imageUrl, urgency, category, summary, translatedText, userId } = await req.json();

    if (!rawText || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Step 1: Nominatim real-address reverse geocoding (most accurate)
    const nominatimBarangay = await nominatimLookup(latitude, longitude);

    // Step 2: PostGIS nearest-centroid fallback (within 5 km of San Fernando)
    const postgisResult = nominatimBarangay
      ? null
      : await detectBarangayFromCoords(longitude, latitude);

    const barangay = nominatimBarangay ?? postgisResult?.barangay ?? null;
    const distanceMeters = nominatimBarangay ? 0 : (postgisResult?.distanceMeters ?? null);

    const hasDirectClassification = urgency && category && summary;

    // Insert Complaint with precise PostGIS geometry, auto-detected barangay, and AI-triage parameters
    const created: any[] = await prisma.$queryRaw`
      INSERT INTO "Complaint" (
        id, "rawText", latitude, longitude, "imageUrl", barangay, status, "aiStatus", geom, "updatedAt",
        urgency, category, summary, "translatedText", "userId"
      )
      VALUES (
        gen_random_uuid(),
        ${rawText},
        ${latitude},
        ${longitude},
        ${imageUrl || null},
        ${barangay},
        CAST('PENDING' AS "TicketStatus"),
        CAST(${hasDirectClassification ? 'SUCCESS' : 'PENDING'} AS "AiStatus"),
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
        NOW(),
        CAST(${urgency || null} AS "UrgencyLevel"),
        CAST(${category || null} AS "IssueCategory"),
        ${summary || null},
        ${translatedText || null},
        ${userId || null}
      )
      RETURNING id;
    `;

    const complaintId = created[0].id;

    // Trigger async triage webhook only as fallback if not pre-triaged
    if (!hasDirectClassification) {
      const webhookUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-complaint`;
      fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ complaintId, latitude, longitude }),
      }).catch(err => console.error("Async webhook trigger failed", err));
    }

    return NextResponse.json({
      success: true,
      id: complaintId,
      barangay,
      distanceMeters,
    }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
