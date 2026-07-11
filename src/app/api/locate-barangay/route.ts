import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SAN_FERNANDO_BARANGAYS = [
  "Alasas", "Baliti", "Bulaon", "Calulut", "Del Carmen", "Del Pilar",
  "Del Rosario", "Dela Paz Norte", "Dela Paz Sur", "Dolores", "Juliana",
  "Lara", "Lourdes", "Magliman", "Maimpis", "Malino", "Malpitic",
  "Pandaras", "Panipuan", "Pulung Bulu", "Quebiawan", "Saguin",
  "San Agustin", "San Felipe", "San Isidro", "San Jose", "San Juan",
  "San Nicolas", "San Pedro Cutud", "Santa Lucia", "Santa Teresita",
  "Santo Niño", "Santo Rosario", "Sindalan", "Telabastagan",
];

/**
 * Normalize a raw place name from Nominatim to match our barangay list.
 * Handles variations like "Barangay Del Pilar", "Brgy. Del Pilar", "Santo Rosario (Poblacion)", etc.
 */
function normalizeBarangayName(raw: string): string | null {
  if (!raw) return null;

  // Strip common prefixes
  let cleaned = raw
    .replace(/^barangay\s+/i, "")
    .replace(/^brgy\.?\s+/i, "")
    .replace(/\s*\(.*?\)\s*/g, "") // strip (Poblacion), etc.
    .trim();

  // Direct match
  const direct = SAN_FERNANDO_BARANGAYS.find(
    (b) => b.toLowerCase() === cleaned.toLowerCase()
  );
  if (direct) return direct;

  // Partial / fuzzy match — find barangay whose name is contained in the raw string
  const partial = SAN_FERNANDO_BARANGAYS.find(
    (b) =>
      raw.toLowerCase().includes(b.toLowerCase()) ||
      b.toLowerCase().includes(cleaned.toLowerCase())
  );
  return partial ?? null;
}

/**
 * Step 1: Reverse-geocode via Nominatim (OpenStreetMap) to get real address.
 * Extracts barangay from: village, suburb, neighbourhood, quarter, city_district.
 */
async function nominatimLookup(latitude: number, longitude: number): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${latitude}&lon=${longitude}&format=json&zoom=16&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent
        "User-Agent": "AquaTrack-CSFWD/1.0 (aquatrack@csfwd.gov.ph)",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const addr = data?.address ?? {};

    // Try each field that Nominatim uses for barangay-level admin
    const candidates = [
      addr.village,
      addr.suburb,
      addr.neighbourhood,
      addr.quarter,
      addr.city_district,
      addr.hamlet,
      addr.residential,
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const matched = normalizeBarangayName(candidate);
      if (matched) return matched;
    }

    return null;
  } catch (err) {
    console.warn("Nominatim reverse geocoding failed:", err);
    return null;
  }
}

/**
 * Step 2 (fallback): PostGIS nearest-centroid lookup.
 * Only used when Nominatim doesn't match any known San Fernando barangay.
 * Uses ST_Distance with ::geography cast for meter-accurate distances.
 */
async function postgisNearestBarangay(
  longitude: number,
  latitude: number
): Promise<{ barangay: string; distanceMeters: number } | null> {
  try {
    const result = await pool.query(
      `
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
      `,
      [longitude, latitude]
    );

    if (result.rows.length === 0) return null;

    const { name, distance_meters } = result.rows[0];
    const distanceMeters = Math.round(parseFloat(distance_meters));

    // If the nearest centroid is more than 5km away, the user is likely
    // outside San Fernando entirely — don't return a false match.
    if (distanceMeters > 5000) return null;

    return { barangay: name, distanceMeters };
  } catch (err) {
    console.error("PostGIS centroid fallback failed:", err);
    return null;
  }
}

/**
 * POST /api/locate-barangay
 * Body: { latitude: number, longitude: number }
 *
 * Resolution order:
 * 1. Nominatim reverse geocoding → match to known San Fernando barangay
 * 2. PostGIS nearest-centroid fallback (only within 5 km of San Fernando)
 * 3. null → outside service area
 */
export async function POST(req: Request) {
  try {
    const { latitude, longitude } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    // Step 1: Nominatim real-address lookup
    const nominatimBarangay = await nominatimLookup(latitude, longitude);
    if (nominatimBarangay) {
      return NextResponse.json({
        barangay: nominatimBarangay,
        distanceMeters: 0,
        source: "nominatim",
      });
    }

    // Step 2: PostGIS nearest-centroid (within 5 km only)
    const postgisResult = await postgisNearestBarangay(longitude, latitude);
    if (postgisResult) {
      return NextResponse.json({
        barangay: postgisResult.barangay,
        distanceMeters: postgisResult.distanceMeters,
        source: "postgis-centroid",
      });
    }

    // Step 3: Outside service area
    return NextResponse.json({
      barangay: null,
      distanceMeters: null,
      source: "none",
      message: "Location is outside City of San Fernando service area.",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
