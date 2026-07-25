import React from "react";
import { render } from "@react-email/components";
import CrewNotificationEmail from "../components/emails/CrewNotificationEmail";

export async function sendCrewNotification(
  email: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || "";
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "garciagamer432@gmail.com";
  if (!email) return { success: false, error: "Recipient email is required" };
  if (!apiKey) return { success: false, error: "Missing Brevo API Key" };
  
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "AquaTrack Alerts",
          email: senderEmail,
        },
        to: [{ email }],
        subject,
        htmlContent,
      }),
    });

    if (!res.ok) {
      const errBody = await res.json();
      return { success: false, error: errBody.message || `Brevo API HTTP ${res.status}` };
    }

    const data = await res.json();
    return { success: true, id: data.messageId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendReactEmailNotification(
  email: string,
  subject: string,
  payload: { crewName: string; incidentId: string; urgency: string; description: string }
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!email) return { success: false, error: "Recipient email is required" };

  try {
    // Compile the React Email component into a static HTML string
    const htmlContent = await render(React.createElement(CrewNotificationEmail, payload));

    return await sendCrewNotification(email, subject, htmlContent);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
