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

const text = "Sobrang kayna ing danum keni alang tulo";
console.log(`=== TESTING AI CLASSIFICATION (Vertex AI & AI Studio Fallback) ===`);
console.log(`Text to triage: "${text}"\n`);

async function run() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const vertexCredentials = process.env.GOOGLE_VERTEX_CREDENTIALS;
  
  let models = [];
  let usingVertex = false;

  if (vertexCredentials) {
    try {
      const trimmed = vertexCredentials.trim();
      const decodedCreds = (trimmed.startsWith("{") || trimmed.startsWith("'") || trimmed.startsWith('"'))
        ? trimmed.replace(/^['"]|['"]$/g, "")
        : Buffer.from(trimmed, "base64").toString("utf-8");
      
      console.log("[Vertex AI] Attempting to parse credentials...");
      const parsedCreds = JSON.parse(decodedCreds);
      console.log(`[Vertex AI] Loaded Service Account: ${parsedCreds.client_email}`);

      const vertex = createVertex({
        project: process.env.GOOGLE_VERTEX_PROJECT || "aquatrack-prod",
        location: process.env.GOOGLE_VERTEX_LOCATION || "global",
        googleAuthOptions: {
          credentials: parsedCreds
        }
      });
      models = [
        { name: "gemini-3.7-flash (Vertex)", model: vertex("gemini-3.7-flash") },
        { name: "gemini-3.5-flash-lite (Vertex)", model: vertex("gemini-3.5-flash-lite") }
      ];
      usingVertex = true;
      console.log("[Vertex AI] Vertex provider initialized successfully.\n");
    } catch (err) {
      console.error("[Vertex AI] Failed to parse Vertex credentials, falling back to AI Studio:", err.message);
    }
  }

  if (!usingVertex || models.length === 0) {
    console.log("[AI Studio] Initializing Google AI Studio fallback...");
    if (!apiKey) {
      console.error("[AI Studio] ERROR: Missing GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY");
      return;
    }
    const googleProvider = createGoogle({ apiKey });
    models = [
      { name: "gemini-3.7-flash (AI Studio)", model: googleProvider("gemini-3.7-flash") },
      { name: "gemini-3.5-flash-lite (AI Studio)", model: googleProvider("gemini-3.5-flash-lite") }
    ];
  }

  for (let i = 0; i < models.length; i++) {
    const { name, model } = models[i];
    console.log(`[Triage Attempt ${i + 1}] Trying model: ${name}...`);
    try {
      const start = Date.now();
      const result = await generateText({
        model,
        temperature: 0.0,
        prompt: `Categorize this water complaint: "${text}"`
      });
      const duration = Date.now() - start;
      console.log(`[Triage Success] Model ${name} completed in ${duration}ms!`);
      console.log(`Response: ${result.text.trim()}\n`);
      return; // Exit on first success
    } catch (err) {
      console.error(`[Triage Failed] Model ${name} failed:`, err.message);
    }
  }
}

run();
