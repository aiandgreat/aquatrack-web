const fs = require('fs');
const { Pool } = require('pg');

let databaseUrl = '';
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m);
  if (match) databaseUrl = match[1];
  else {
    const directMatch = envContent.match(/^DIRECT_URL\s*=\s*["']?([^"'\r\n]+)/m);
    if (directMatch) databaseUrl = directMatch[1];
  }
} catch (e) {
  console.error("Failed to read .env file:", e);
}

if (!databaseUrl) {
  console.error("Error: DATABASE_URL not found in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    // 1. Find the complaint
    console.log("Searching for complaint starting with '62d151ab'...");
    const res = await client.query('SELECT * FROM "Complaint" WHERE id::text LIKE \'62d151ab%\'');
    if (res.rows.length === 0) {
      console.log("❌ Complaint not found.");
      // Also query all pending complaints to see what exists
      const allPending = await client.query('SELECT id, summary, status, latitude, longitude, barangay FROM "Complaint" WHERE status = \'PENDING\' LIMIT 5');
      console.log("\nRecent PENDING complaints:");
      console.table(allPending.rows);
      return;
    }

    const complaint = res.rows[0];
    console.log("✅ Found Complaint:");
    console.log(complaint);

    // 2. Find nearby nodes within 500m
    console.log("\nSearching for nodes within 500m of this complaint...");
    const nodesRes = await client.query(`
      SELECT id, name, status, latitude, longitude,
        ST_Distance(
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          geom::geography
        ) AS distance_meters
      FROM "TelemetryNode"
      ORDER BY distance_meters ASC
    `, [complaint.longitude, complaint.latitude]);

    console.log("\nNodes sorted by proximity:");
    console.table(nodesRes.rows.map(n => ({
      id: n.id,
      name: n.name,
      status: n.status,
      distance: `${Math.round(parseFloat(n.distance_meters))} meters`
    })));

    // 3. Find any active diagnostic alerts for nearby nodes
    console.log("\nActive Diagnostic Alerts for these nodes:");
    const alertsRes = await client.query(`
      SELECT a.id, a."nodeId", a.status, a."geminiAnalysis", a."createdAt", n.name AS "nodeName"
      FROM "DiagnosticAlert" a
      JOIN "TelemetryNode" n ON a."nodeId" = n.id
      WHERE a.status IN ('PENDING', 'ONGOING')
    `);
    console.table(alertsRes.rows.map(a => ({
      id: a.id,
      node: a.nodeName,
      status: a.status,
      probableRootCause: a.geminiAnalysis?.probableRootCause || 'N/A',
      recommendedAction: a.geminiAnalysis?.recommendedAction || 'N/A'
    })));

  } catch (err) {
    console.error("Query failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
