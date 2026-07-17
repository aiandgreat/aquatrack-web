const fs = require('fs');

// Read san-fernando-boundary.ts to extract coordinates
const boundaryFile = fs.readFileSync('./src/lib/san-fernando-boundary.ts', 'utf8');
const coordRegex = /\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/g;
const polygon = [];
let match;
while ((match = coordRegex.exec(boundaryFile)) !== null) {
  polygon.push([parseFloat(match[1]), parseFloat(match[2])]);
}

console.log("Extracted polygon points:", polygon.length);

function pointInPolygon(lng, lat, poly) {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];
    const intersects = ((yi > lat) !== (yj > lat))
        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

const SF_BBOX = {
  minLng: 120.5942962,
  maxLng: 120.7278114,
  minLat: 15.0040515,
  maxLat: 15.1342393,
};

function isOutsideSanFernando(lat, lng) {
  if (lat < SF_BBOX.minLat || lat > SF_BBOX.maxLat || lng < SF_BBOX.minLng || lng > SF_BBOX.maxLng) {
    return true;
  }
  return !pointInPolygon(lng, lat, polygon);
}

const BARANGAY_COORDS = {
  Alasas: [120.6563899, 15.0547768],
  Baliti: [120.6242556, 15.105583],
  Bulaon: [120.6750, 15.0740],
  Calulut: [120.6486068, 15.0959271],
  "Del Carmen": [120.7010, 15.0320],
  "Del Pilar": [120.6936, 15.0240],
  "Del Rosario": [120.6364643, 15.0624038],
  "Dela Paz Norte": [120.6860, 15.0450],
  "Dela Paz Sur": [120.6365852, 15.0747509],
  Dolores: [120.6900, 15.0330],
  Juliana: [120.6910, 15.0220],
  Lara: [120.6710, 15.0440],
  Lourdes: [120.6880, 15.0250],
  Magliman: [120.6750, 15.0250], // updated
  Maimpis: [120.6900, 15.0520],
  Malino: [120.6276217, 15.1220944],
  Malpitic: [120.6560699, 15.0791112],
  Pandaras: [120.6950, 15.0150],
  Panipuan: [120.6244862, 15.1047486],
  "Pulung Bulu": [120.7120, 15.0250],
  Quebiawan: [120.6950, 15.0420],
  Saguin: [120.6251223, 15.0893843],
  "San Agustin": [120.6850, 15.0290],
  "San Felipe": [120.6800, 15.0350],
  "San Isidro": [120.6563899, 15.0547768],
  "San Jose": [120.6936, 15.0310],
  "San Juan": [120.6810, 15.0190],
  "San Nicolas": [120.6936, 15.0278],
  "San Pedro Cutud": [120.6916473, 15.0169968],
  "Santa Lucia": [120.6950, 15.0210],
  "Santa Teresita": [120.6920, 15.0180],
  "Santo Niño": [120.6720, 15.0250],
  "Santo Rosario": [120.6936, 15.0278],
  "Sindalan": [120.6381548, 15.0744109],
  "Telabastagan": [120.6082767, 15.1137201],
};

console.log("Checking barangays coords...");
let outsideCount = 0;
Object.entries(BARANGAY_COORDS).forEach(([name, [lng, lat]]) => {
  const outside = isOutsideSanFernando(lat, lng);
  if (outside) {
    console.log(`❌ ${name} at [${lng}, ${lat}] is OUTSIDE San Fernando.`);
    outsideCount++;
  } else {
    console.log(`✅ ${name} at [${lng}, ${lat}] is INSIDE.`);
  }
});
console.log("Total outside:", outsideCount);
