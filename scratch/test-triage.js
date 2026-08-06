const fs = require('fs');
const path = require('path');

// 1. Read API Key from .env manually
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const geminiKeyLine = envContent.split('\n').find(line => line.startsWith('GEMINI_API_KEY='));
if (!geminiKeyLine) {
  console.error("Could not find GEMINI_API_KEY in .env");
  process.exit(1);
}
const apiKey = geminiKeyLine.split('=')[1].replace(/"/g, '').trim();

// 2. Sample inputs to test dialect translation and categorization accuracy
const testCases = [
  {
    name: "Kapampangan discolored water",
    text: "matuling ya kule ing danum a mamagus king gripo mi mga adwang aldo ne ayni"
  },
  {
    name: "Kapampangan no flow",
    text: "alang danum keti kekami manibat nanding abak malati agus nung mamagus man"
  },
  {
    name: "User out-of-prompt Kapampangan query",
    text: "kule burak ing danum keni"
  }
];

const systemPrompt = `You are a municipal water district engineer. Parse the following citizen report. Note that the report may be written in English, Tagalog, Taglish, or Kapampangan dialect. Use this Kapampangan translation guide to translate accurately to English:
- "matuling" / "kule matuling" = black / dark water (highly critical, maps to CHEMICAL_DISCOLORATION_CONTAMINATION or HIGH_TURBIDITY)
- "dilo" / "kule dilo" / "kulasisi" = yellow / yellowish water (maps to HIGH_MINERAL_CONTENT_TDS or HIGH_TURBIDITY)
- "malutu" / "kule malutu" = red / reddish / rusty water
- "taya" / "kule taya" = brown / muddy water
- "malino" = clear water
- "ala danum" / "alang danum" = no water / dry faucet (maps to PIPELINE_BREACH_PRESSURE_DROP, high urgency)
- "malati agus" / "mababa agus" = low water pressure / weak flow
- "mabau" = smelly / bad odor

Translate the report to English, capturing all details including water discoloration, flow, and duration. Classify category (PIPELINE_BREACH_PRESSURE_DROP, HIGH_TURBIDITY, HIGH_MINERAL_CONTENT_TDS, CHEMICAL_DISCOLORATION_CONTAMINATION, UNCLASSIFIED_INFRASTRUCTURE_ANOMALY) and urgency (LOW, MEDIUM, HIGH, CRITICAL). Summarize in one sentence.`;

async function runTest() {
  console.log(`=== Testing Gemini 3.5 Flash Lite (Temp: 0.0) ===\n`);
  
  for (const tc of testCases) {
    console.log(`Test Case: "${tc.name}"`);
    console.log(`Input Text: "${tc.text}"`);
    
    const startTime = Date.now();
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\nReport: "${tc.text}"` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.0,
            maxOutputTokens: 1024
          }
        })
      });
      
      const latency = Date.now() - startTime;
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
      }
      
      const data = await response.json();
      const resultText = data.candidates[0].content.parts[0].text;
      
      console.log(`Latency: ${latency}ms`);
      console.log(`Result:\n${JSON.stringify(JSON.parse(resultText), null, 2)}`);
      console.log(`-----------------------------------------------\n`);
    } catch (err) {
      console.error(`Error in "${tc.name}":`, err.message);
      console.log(`-----------------------------------------------\n`);
    }
  }
}

runTest();
