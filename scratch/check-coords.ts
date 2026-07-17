import { isOutsideSanFernando } from "./src/lib/geo-utils";

const BARANGAY_COORDS: Record<string, [number, number]> = {
  Alasas: [120.6780, 15.0120],
  Baliti: [120.7020, 15.0560],
  Bulaon: [120.6750, 15.0740],
  Calulut: [120.7100, 15.0600],
  "Del Carmen": [120.7010, 15.0320],
  "Del Pilar": [120.6936, 15.0240],
  "Del Rosario": [120.7180, 15.0080],
  "Dela Paz Norte": [120.6860, 15.0450],
  "Dela Paz Sur": [120.7080, 15.0180],
  Dolores: [120.6900, 15.0330],
  Juliana: [120.6910, 15.0220],
  Lara: [120.6710, 15.0440],
  Lourdes: [120.6880, 15.0250],
  Magliman: [120.6650, 15.0180],
  Maimpis: [120.6900, 15.0520],
  Malino: [120.7250, 15.0480],
  Malpitic: [120.7050, 15.0480],
  Pandaras: [120.6950, 15.0150],
  Panipuan: [120.7380, 15.0620],
  "Pulung Bulu": [120.7120, 15.0250],
  Quebiawan: [120.6950, 15.0420],
  Saguin: [120.6900, 15.0620],
  "San Agustin": [120.6850, 15.0290],
  "San Felipe": [120.6800, 15.0350],
  "San Isidro": [120.7080, 15.0010],
  "San Jose": [120.6936, 15.0310],
  "San Juan": [120.6810, 15.0190],
  "San Nicolas": [120.6936, 15.0278],
  "San Pedro Cutud": [120.7050, 15.0110],
  "Santa Lucia": [120.6950, 15.0210],
  "Santa Teresita": [120.6920, 15.0180],
  "Santo Niño": [120.6720, 15.0250],
  "Santo Rosario": [120.6936, 15.0278],
  "Sindalan": [120.6900, 15.0680],
  "Telabastagan": [120.6850, 15.0800],
};

console.log("Checking barangays coords...");
Object.entries(BARANGAY_COORDS).forEach(([name, [lng, lat]]) => {
  const outside = isOutsideSanFernando(lat, lng);
  if (outside) {
    console.log(`❌ ${name} at [${lng}, ${lat}] is OUTSIDE San Fernando.`);
  } else {
    console.log(`✅ ${name} at [${lng}, ${lat}] is INSIDE.`);
  }
});
