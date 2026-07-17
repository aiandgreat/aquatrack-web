const fs = require('fs');
const https = require('https');

// Standalone script to resolve correct coordinates for the 14 outside barangays via Nominatim
const outsideBarangays = [
  "Alasas", "Baliti", "Calulut", "Del Rosario", "Dela Paz Sur", 
  "Magliman", "Malino", "Malpitic", "Panipuan", "Saguin", 
  "San Isidro", "San Pedro Cutud", "Sindalan", "Telabastagan"
];

function fetchBarangayCoords(name) {
  return new Promise((resolve) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent("Barangay " + name + ", San Fernando, Pampanga")}&format=json&limit=1`;
    const options = {
      headers: { 'User-Agent': 'AquaTrack-Web/1.0' }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const results = JSON.parse(data);
          if (results && results.length > 0) {
            resolve({ name, lng: parseFloat(results[0].lon), lat: parseFloat(results[0].lat) });
          } else {
            // Try without "Barangay " prefix
            const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name + ", San Fernando, Pampanga")}&format=json&limit=1`;
            https.get(url2, options, (res2) => {
              let data2 = '';
              res2.on('data', chunk => data2 += chunk);
              res2.on('end', () => {
                try {
                  const results2 = JSON.parse(data2);
                  if (results2 && results2.length > 0) {
                    resolve({ name, lng: parseFloat(results2[0].lon), lat: parseFloat(results2[0].lat) });
                  } else {
                    resolve({ name, error: 'Not found' });
                  }
                } catch(e) { resolve({ name, error: e.message }); }
              });
            });
          }
        } catch (e) {
          resolve({ name, error: e.message });
        }
      });
    }).on('error', (err) => {
      resolve({ name, error: err.message });
    });
  });
}

async function run() {
  console.log("Fetching correct coordinates...");
  const results = [];
  for (const name of outsideBarangays) {
    const res = await fetchBarangayCoords(name);
    console.log(res);
    results.push(res);
    // Sleep a bit to be nice to OSM
    await new Promise(r => setTimeout(r, 1200));
  }
}

run();
