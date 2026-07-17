import { SAN_FERNANDO_POLYGON } from "./san-fernando-boundary";

/**
 * Ray-casting point-in-polygon algorithm (Shimrat, 1962).
 * Determines if a point [lng, lat] lies inside a closed polygon.
 *
 * @param lng - Longitude of the point to test
 * @param lat - Latitude of the point to test
 * @param polygon - Array of [lng, lat] pairs forming the boundary
 * @returns true if the point is inside the polygon
 */
export function pointInPolygon(
  lng: number,
  lat: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0]; // lng
    const yi = polygon[i][1]; // lat
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersects =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

// Pre-computed bounding box for fast rejection (avoids full polygon test)
const SF_BBOX = {
  minLng: 120.5942962,
  maxLng: 120.7278114,
  minLat: 15.0040515,
  maxLat: 15.1342393,
};

/**
 * Checks if a coordinate is outside the City of San Fernando, Pampanga.
 * Uses a bounding-box fast-reject first, then falls back to the accurate
 * 788-vertex polygon boundary from OpenStreetMap.
 *
 * @param lat - Latitude to check
 * @param lng - Longitude to check
 * @returns true if the point is OUTSIDE the city
 */
export function isOutsideSanFernando(lat: number, lng: number): boolean {
  // Fast bounding-box rejection first (very cheap)
  if (
    lat < SF_BBOX.minLat ||
    lat > SF_BBOX.maxLat ||
    lng < SF_BBOX.minLng ||
    lng > SF_BBOX.maxLng
  ) {
    return true;
  }

  // Accurate polygon check using OSM boundary
  return !pointInPolygon(lng, lat, SAN_FERNANDO_POLYGON);
}
