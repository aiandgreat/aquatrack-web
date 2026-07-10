import React from "react";
import { Resend } from "resend";
import CrewNotificationEmail from "../components/emails/CrewNotificationEmail";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummykey");

export async function sendCrewNotification(
  email: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!email) return { success: false, error: "Recipient email is required" };
  
  try {
    const response = await resend.emails.send({
      from: "AquaTrack Alerts <alerts@aquatrack.dev>",
      to: email,
      subject,
      html: htmlContent,
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
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
    const response = await resend.emails.send({
      from: "AquaTrack Alerts <alerts@aquatrack.dev>",
      to: email,
      subject,
      react: React.createElement(CrewNotificationEmail, payload),
    });

    if (response.error) {
      return { success: false, error: response.error.message };
    }

    return { success: true, id: response.data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
