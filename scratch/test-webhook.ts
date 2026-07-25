import "dotenv/config";

async function main() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-complaint`;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Latest complaint ID from your test
  const complaintId = "29e92823-3882-411a-88f5-f26b5d63f03b";
  const latitude = 15.0333;
  const longitude = 120.6797;
  const rawText = "Muddy water in Dolores";

  console.log(`Triggering webhook at: ${url}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`
      },
      body: JSON.stringify({ complaintId, latitude, longitude, rawText })
    });

    console.log(`Response Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(`Response Body: \n${text}`);
  } catch (err: any) {
    console.error("Fetch failed:", err);
  }
}

main();
