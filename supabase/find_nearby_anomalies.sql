-- PostGIS RPC Function: find_nearby_anomalies
-- Finds TelemetryNodes in MAINTENANCE or OFFLINE status within a given radius
-- of a reported complaint location using PostGIS ST_DWithin.
--
-- Usage:
--   SELECT * FROM find_nearby_anomalies(14.5995, 120.9842, 500);

CREATE OR REPLACE FUNCTION find_nearby_anomalies(
  report_lat DOUBLE PRECISION,
  report_lng DOUBLE PRECISION,
  max_distance_meters DOUBLE PRECISION DEFAULT 500
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  status TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    n.id::TEXT,
    n.name,
    n.status::TEXT,
    n.latitude,
    n.longitude,
    ST_Distance(
      n.geom::geography,
      ST_SetSRID(ST_MakePoint(report_lng, report_lat), 4326)::geography
    ) AS distance_meters
  FROM "TelemetryNode" n
  WHERE
    n.status IN ('MAINTENANCE', 'OFFLINE')
    AND ST_DWithin(
      n.geom::geography,
      ST_SetSRID(ST_MakePoint(report_lng, report_lat), 4326)::geography,
      max_distance_meters
    )
  ORDER BY distance_meters ASC;
$$;
