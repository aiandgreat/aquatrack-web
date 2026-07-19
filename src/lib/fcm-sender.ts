import { JWT } from "google-auth-library";

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const projectId = process.env.FIREBASE_PROJECT_ID;

export async function sendFcmNotification(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) {
  if (!clientEmail || !privateKey || !projectId) {
    console.warn("[FCM SENDER] Missing Firebase credentials. Running in SIMULATION mode.");
    console.log(`[FCM SENDER (MOCK)] Sending notification to ${tokens.length} devices: "${title}"`);
    return { success: true, mode: "simulation", count: tokens.length };
  }

  try {
    // Initialize Google JWT Client
    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    // Request OAuth2 access token
    const tokenResponse = await jwtClient.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error("Failed to retrieve Google Auth OAuth2 token for FCM");
    }

    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    let successCount = 0;

    for (const token of tokens) {
      try {
        const payload = {
          message: {
            token,
            notification: { title, body },
            data,
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "access_control_allow_origin": "*",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          const errBody = await res.json();
          console.error(`FCM send error for token ${token.slice(0, 10)}...:`, errBody);
        }
      } catch (err) {
        console.error(`Network error sending FCM to token:`, err);
      }
    }

    console.log(`[FCM SENDER] Dispatched notifications. Successfully sent ${successCount}/${tokens.length} messages.`);
    return { success: true, mode: "production", count: successCount };
  } catch (err: any) {
    console.error("[FCM SENDER] Google Token authentication failed:", err);
    throw new Error(`FCM token validation error: ${err.message}`);
  }
}
