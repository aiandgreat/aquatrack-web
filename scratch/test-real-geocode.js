const fs = require("fs");
const path = require("path");

// Load .env variables
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let val = parts.slice(1).join("=").trim();
      // Strip outer quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

const query = process.argv[2] || "SM City Pampanga";
console.log(`=== TESTING GEOCODE ENDPOINT FUNCTIONALITY FOR: "${query}" ===\n`);

async function runTests() {
  const cleanQuery = query.trim();

  // 1. Google Geocoding
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
  console.log(`[Google Geocoding] Key configured: ${googleApiKey ? "YES" : "NO"}`);
  if (googleApiKey) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(cleanQuery)}&key=${googleApiKey}`;
      const start = Date.now();
      const res = await fetch(googleUrl);
      const duration = Date.now() - start;
      console.log(`[Google Geocoding] HTTP Status: ${res.status} (${duration}ms)`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[Google Geocoding] API Status: ${data.status}`);
        if (data.status === "OK" && data.results && data.results.length > 0) {
          console.log(`  - Match: ${data.results[0].formatted_address}`);
          console.log(`  - Lat: ${data.results[0].geometry.location.lat}, Lng: ${data.results[0].geometry.location.lng}`);
        } else {
          console.log(`  - Details:`, data);
        }
      }
    } catch (err) {
      console.error(`[Google Geocoding] Request failed:`, err.message);
    }
  }
  console.log("");

  // 2. Mapbox Geocoding
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  console.log(`[Mapbox Geocoding] Token configured: ${mapboxToken ? "YES" : "NO"}`);
  if (mapboxToken) {
    try {
      const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cleanQuery)}.json?access_token=${mapboxToken}&limit=1`;
      const start = Date.now();
      const res = await fetch(mapboxUrl);
      const duration = Date.now() - start;
      console.log(`[Mapbox Geocoding] HTTP Status: ${res.status} (${duration}ms)`);
      if (res.ok) {
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          console.log(`  - Match: ${feature.place_name}`);
          console.log(`  - Center: ${feature.center} (Lng, Lat)`);
          console.log(`  - Place types:`, feature.place_type);
          console.log(`  - Relevance: ${feature.relevance}`);
        } else {
          console.log(`  - No features found.`);
        }
      }
    } catch (err) {
      console.error(`[Mapbox Geocoding] Request failed:`, err.message);
    }
  }
  console.log("");

  // 3. Nominatim (OpenStreetMap) Geocoding
  console.log(`[Nominatim Geocoding] Requesting OSM...`);
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&format=json&limit=1`;
    const start = Date.now();
    const res = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "AquaTrack-Client-Portal-Testing"
      }
    });
    const duration = Date.now() - start;
    console.log(`[Nominatim Geocoding] HTTP Status: ${res.status} (${duration}ms)`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const match = data[0];
        console.log(`  - Match: ${match.display_name}`);
        console.log(`  - Lat: ${match.lat}, Lon: ${match.lon}`);
      } else {
        console.log(`  - No OSM matches found.`);
      }
    }
  } catch (err) {
    console.error(`[Nominatim Geocoding] Request failed:`, err.message);
  }
}

runTests();
