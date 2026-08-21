const fs = require("fs");
const path = require("path");
const { generateText } = require("ai");
const { createGoogle } = require("@ai-sdk/google");
const { createVertex } = require("@ai-sdk/google-vertex");

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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  });
}

const testText = "Sobrang kayna ing danum keni, ala kaming tulo 24 oras na.";
console.log(`================================================================`);
console.log(`      AQUATRACK AI ENDPOINTS LIVENESS & VERIFICATION SCRIPT      `);
console.log(`================================================================`);
console.log(`Text Query: "${testText}"\n`);

// Helper to clean up JSON blocks from text response
function cleanJsonText(rawText) {
  return rawText.replace(/```json|```/g, "").trim();
}

// 1. Direct SDK Call: Vertex AI
async function testDirectVertex() {
  console.log(`--- [1/4] TESTING DIRECT VERTEX AI CALL (Primary) ---`);
  const vertexCredentials = process.env.GOOGLE_VERTEX_CREDENTIALS;
  if (!vertexCredentials) {
    console.log("⚠️ SKIPPED: GOOGLE_VERTEX_CREDENTIALS is not set in .env");
    console.log("\n");
    return;
  }

  try {
    const trimmed = vertexCredentials.trim();
    const decodedCreds = (trimmed.startsWith("{") || trimmed.startsWith("'") || trimmed.startsWith('"'))
      ? trimmed.replace(/^['"]|['"]$/g, "")
      : Buffer.from(trimmed, "base64").toString("utf-8");
    
    const sa = JSON.parse(decodedCreds);
    console.log(`Initialized Vertex AI for Project: ${sa.project_id} (${sa.client_email})`);

    const vertex = createVertex({
      project: process.env.GOOGLE_VERTEX_PROJECT || sa.project_id || "aquatrack-prod",
      location: process.env.GOOGLE_VERTEX_LOCATION || "global",
      googleAuthOptions: { credentials: sa }
    });

    const start = Date.now();
    const result = await generateText({
      model: vertex("gemini-3.7-flash"),
      temperature: 0.0,
      prompt: `Translate to English and categorize as JSON matching: { "category": string, "urgency": string }:\n"${testText}"`
    });
    const duration = Date.now() - start;

    console.log(`SUCCESS: Vertex AI responded in ${duration}ms!`);
    console.log(`Response:\n`, cleanJsonText(result.text));
  } catch (err) {
    console.error(`❌ ERROR: Vertex AI direct call failed:`, err.message);
  }
  console.log("\n");
}

// 2. Direct SDK Call: Google AI Studio Fallback
async function testDirectAiStudio() {
  console.log(`--- [2/4] TESTING DIRECT GOOGLE AI STUDIO CALL (Fallback) ---`);
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY is not set in .env");
    console.log("\n");
    return;
  }

  try {
    console.log("Initializing Google AI Studio provider...");
    const googleProvider = createGoogle({ apiKey });

    const start = Date.now();
    const result = await generateText({
      model: googleProvider("gemini-3.7-flash"),
      temperature: 0.0,
      prompt: `Translate to English and categorize as JSON matching: { "category": string, "urgency": string }:\n"${testText}"`
    });
    const duration = Date.now() - start;

    console.log(`SUCCESS: Google AI Studio responded in ${duration}ms!`);
    console.log(`Response:\n`, cleanJsonText(result.text));
  } catch (err) {
    console.error(`❌ ERROR: Google AI Studio direct call failed:`, err.message);
  }
  console.log("\n");
}

// 3. Local Next.js API Route
async function testLocalNextJsTriage() {
  console.log(`--- [3/4] TESTING LOCAL NEXT.JS TRIAGE API ROUTE (/api/triage) ---`);
  const ports = [3000, 3001];
  let success = false;
  
  for (const port of ports) {
    const url = `http://localhost:${port}/api/triage`;
    try {
      console.log(`Connecting to ${url}...`);
      const start = Date.now();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText })
      });
      const duration = Date.now() - start;
      
      console.log(`Status: ${res.status} (${duration}ms)`);
      if (res.ok) {
        const body = await res.json();
        console.log(`SUCCESS: Local Next.js AI triage is online on port ${port}!`);
        console.log(`Triage classification output:\n`, JSON.stringify(body.result || body, null, 2));
        success = true;
        break;
      } else {
        const errText = await res.text();
        console.warn(`WARN: Request failed with error: ${errText}`);
      }
    } catch (err) {
      console.log(`Port ${port} is not reachable (${err.message}).`);
    }
  }

  if (!success) {
    console.log(`\n❌ Local Next.js AI Triage endpoint is OFFLINE.`);
    console.log(`👉 To start the local server, run: npm run dev`);
  }
  console.log("\n");
}

// 4. Remote Supabase Edge Function
async function testSupabaseEdgeFunction() {
  console.log(`--- [4/4] TESTING SUPABASE EDGE FUNCTION (/functions/v1/triage-complaint) ---`);
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("ERROR: Supabase URL or Service Role Key is not configured in .env");
    return;
  }

  const url = `${supabaseUrl}/functions/v1/triage-complaint`;
  console.log(`Connecting to Edge Function at: ${url}...`);

  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        complaintId: "triage-verification-test",
        rawText: testText,
        latitude: 15.029,
        longitude: 120.690
      })
    });
    const duration = Date.now() - start;

    console.log(`Status: ${res.status} (${duration}ms)`);
    if (res.ok) {
      const body = await res.json();
      console.log(`SUCCESS: Supabase Edge Function is ONLINE and responding!`);
      console.log(`Response payload:\n`, JSON.stringify(body, null, 2));
    } else {
      const errText = await res.text();
      console.error(`❌ ERROR: Edge function request failed: ${errText}`);
    }
  } catch (err) {
    console.error(`❌ ERROR: Failed to connect to Edge function:`, err.message);
  }
  console.log("\n");
}

async function runAll() {
  await testDirectVertex();
  await testDirectAiStudio();
  await testLocalNextJsTriage();
  await testSupabaseEdgeFunction();
  console.log("=== Verification complete. ===");
}

runAll();
