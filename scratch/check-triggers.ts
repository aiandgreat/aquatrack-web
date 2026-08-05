import fs from "fs";
import path from "path";

// Load .env manually before prisma imports to ensure environment variables are present
const envPath = path.resolve(__dirname, "../.env");
console.log("envPath resolved to:", envPath);
if (fs.existsSync(envPath)) {
  console.log(".env file exists!");
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let value = trimmed.substring(eqIdx + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value;
      }
    }
  });
} else {
  console.log(".env file NOT found!");
}

console.log("DIRECT_URL from env:", process.env.DIRECT_URL ? "FOUND" : "NOT FOUND");
console.log("DATABASE_URL from env:", process.env.DATABASE_URL ? "FOUND" : "NOT FOUND");

import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    const triggers = await prisma.$queryRaw`
      SELECT 
        trg.tgname AS trigger_name,
        tbl.relname AS table_name,
        p.proname AS function_name
      FROM pg_trigger trg
      JOIN pg_class tbl ON trg.tgrelid = tbl.oid
      JOIN pg_proc p ON trg.tgfoid = p.oid
      JOIN pg_namespace ns ON tbl.relnamespace = ns.oid
      WHERE ns.nspname = 'public'
    `;
    console.log("=== TRIGGERS ===");
    console.log(JSON.stringify(triggers, null, 2));

    const functions = await prisma.$queryRaw`
      SELECT 
        p.proname as function_name,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname NOT LIKE 'pg_%';
    `;
    console.log("=== FUNCTIONS ===");
    for (const f of functions as any) {
      if (f.function_name.includes("telemetry") || f.function_name.includes("status") || f.function_name.includes("node") || f.function_name.includes("anomaly")) {
        console.log(`\n--- Function: ${f.function_name} ---`);
        console.log(f.definition);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
