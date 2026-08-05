-- PostGIS RPC Function: find_nearby_anomalies (v2)
-- Finds TelemetryNodes near a reported complaint using a UNION of two evidence branches:
--
--   Branch 1 — ANOMALOUS_READING:
--     Nodes that are ONLINE and have reported at least one anomalous telemetry
--     reading within the last hour (pressure, pH, turbidity, or TDS out of range).
--     These nodes are working correctly and are actively detecting a water quality issue.
--
--   Branch 2 — NODE_OFFLINE:
--     Nodes that are OFFLINE with no readings in the last hour (dead/unreachable).
--     Their silence near a complaint may indicate the same infrastructure failure
--     the citizen is reporting.
--
-- This replaces the old approach of querying status IN ('MAINTENANCE', 'OFFLINE'),
-- which incorrectly set node status to OFFLINE based on water quality readings rather
-- than actual device connectivity.
--
-- Usage:
--   SELECT * FROM find_nearby_anomalies(14.5995, 120.9842, 500);

-- Drop the old function first because the return type has changed (added signal column)
DROP FUNCTION IF EXISTS find_nearby_anomalies(double precision, double precision, double precision);

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
  distance_meters DOUBLE PRECISION,
  signal TEXT
)
LANGUAGE sql
STABLE
AS $$

  -- Branch 1: Nodes actively reporting anomalous water quality readings
  SELECT
    n.id::TEXT,
    n.name,
    n.status::TEXT,
    n.latitude,
    n.longitude,
    ST_Distance(
      n.geom::geography,
      ST_SetSRID(ST_MakePoint(report_lng, report_lat), 4326)::geography
    ) AS distance_meters,
    'ANOMALOUS_READING'::TEXT AS signal
  FROM "TelemetryNode" n
  INNER JOIN "TelemetryReading" r ON r."nodeId" = n.id
  WHERE
    -- Anomaly thresholds (mirrors telemetry-ingest edge function logic)
    (
      r.pressure < 30
      OR r.ph < 6.5
      OR r.ph > 8.5
      OR r.turbidity > 5
      OR r.tds > 500
    )
    AND r."timestamp" >= NOW() - INTERVAL '1 hour'
    AND ST_DWithin(
      n.geom::geography,
      ST_SetSRID(ST_MakePoint(report_lng, report_lat), 4326)::geography,
      max_distance_meters
    )

  UNION

  -- Branch 2: Dead nodes — OFFLINE with no recent readings (silent/unreachable device)
  SELECT
    n.id::TEXT,
    n.name,
    n.status::TEXT,
    n.latitude,
    n.longitude,
    ST_Distance(
      n.geom::geography,
      ST_SetSRID(ST_MakePoint(report_lng, report_lat), 4326)::geography
    ) AS distance_meters,
    'NODE_OFFLINE'::TEXT AS signal
  FROM "TelemetryNode" n
  WHERE
    n.status = 'OFFLINE'
    AND NOT EXISTS (
      SELECT 1
      FROM "TelemetryReading" r
      WHERE r."nodeId" = n.id
        AND r."timestamp" >= NOW() - INTERVAL '1 hour'
    )
    AND ST_DWithin(
      n.geom::geography,
      ST_SetSRID(ST_MakePoint(report_lng, report_lat), 4326)::geography,
      max_distance_meters
    )

  ORDER BY distance_meters ASC;

$$;
