import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Link,
  Preview,
  Img,
} from "@react-email/components";

interface CrewNotificationEmailProps {
  crewName: string;
  incidentId: string;
  urgency: string;
  description: string;
}

export default function CrewNotificationEmail({
  crewName,
  incidentId,
  urgency,
  description,
}: CrewNotificationEmailProps) {
  // Extract raw code, strip existing "AQ-" prefix, slice if database UUID, and format as AQ-XXXXXXXX
  let rawCode = incidentId || "";
  if (rawCode.toUpperCase().startsWith("AQ-")) {
    rawCode = rawCode.substring(3);
  }
  if (rawCode.length > 8) {
    rawCode = rawCode.substring(0, 8);
  }
  const displayIncidentId = `AQ-${rawCode.toUpperCase()}`;

  // Dynamic color coding for urgency levels
  const isCritical = urgency?.toUpperCase() === "CRITICAL";
  const isHigh = urgency?.toUpperCase() === "HIGH" || urgency?.toUpperCase() === "WARNING";
  
  const urgencyBadgeColor = isCritical
    ? "#991b1b" // Red text
    : isHigh
    ? "#92400e" // Amber text
    : "#1e3a8a"; // Blue text

  const urgencyBadgeBg = isCritical
    ? "#fee2e2" // Red background
    : isHigh
    ? "#fef3c7" // Amber background
    : "#dbeafe"; // Blue background

  const urgencyBadgeBorder = isCritical
    ? "#fca5a5"
    : isHigh
    ? "#fcd34d"
    : "#bfdbfe";

  return (
    <Html>
      <Head />
      <Preview>
        [Dispatch Alert] Urgency: {urgency}. Technician {crewName}, you have a new pipeline anomaly assignment.
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Branding */}
          <Section style={header}>
            <Img
              src="https://eivmilbjlkanxclysczl.supabase.co/storage/v1/object/public/complaint-media/brand-logo-dark.png"
              width="100"
              height="100"
              alt="AquaTrack Logo"
              style={logoImg}
            />
            <Text style={headerSubtitle}>CSFWD OPERATIONS DIVISION</Text>
          </Section>

          {/* Email Content Body */}
          <Section style={contentBody}>
            <Text style={greeting}>Hello {crewName},</Text>
            <Text style={instructionText}>
              You have been dispatched to investigate an active pipeline anomaly. Please review the incident parameters below and head to the site immediately.
            </Text>

            {/* Alert Details Card */}
            <Section style={alertBox}>
              <Text style={details}>
                <span style={label}>INCIDENT ID:</span> 
                <span style={valueMono}> {displayIncidentId}</span>
              </Text>
              
              <Text style={details}>
                <span style={label}>URGENCY LEVEL:</span> 
                <span 
                  style={{
                    ...badge,
                    color: urgencyBadgeColor,
                    backgroundColor: urgencyBadgeBg,
                    borderColor: urgencyBadgeBorder,
                  }}
                >
                  {urgency?.toUpperCase() || "NORMAL"}
                </span>
              </Text>
              
              <Text style={details}>
                <span style={label}>DESCRIPTION:</span> 
                <span style={valueText}> {description}</span>
              </Text>
            </Section>

            {/* Call to Action Button */}
            <Section style={btnContainer}>
              <Link 
                href="https://aquatrack-web.vercel.app/crew" 
                style={button}
              >
                Launch Crew Console
              </Link>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              City of San Fernando Water District (CSFWD) Operations<br />
              Del Pilar, City of San Fernando, Pampanga, Philippines
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styling system for HTML emails
const main = {
  backgroundColor: "#f4f6f9",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  width: "580px",
  maxWidth: "100%",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "hidden" as const,
};

const header = {
  backgroundColor: "#0B2E7A",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const logoImg = {
  display: "block",
  margin: "0 auto",
  width: "100px",
  height: "100px",
};

const headerSubtitle = {
  color: "#93c5fd",
  fontSize: "10px",
  fontWeight: "bold",
  letterSpacing: "2px",
  margin: "4px 0 0 0",
  textTransform: "uppercase" as const,
};

const contentBody = {
  padding: "36px 40px",
};

const greeting = {
  color: "#0f172a",
  fontSize: "18px",
  fontWeight: "bold",
  margin: "0 0 12px 0",
};

const instructionText = {
  color: "#475569",
  fontSize: "14.5px",
  lineHeight: "22px",
  margin: "0 0 24px 0",
};

const alertBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  padding: "20px 24px",
  margin: "24px 0",
};

const details = {
  margin: "12px 0",
  fontSize: "13.5px",
  lineHeight: "20px",
};

const label = {
  color: "#64748b",
  fontWeight: "bold",
  fontSize: "11px",
  letterSpacing: "1px",
  display: "inline-block",
  width: "140px",
};

const valueMono = {
  color: "#0f172a",
  fontFamily: "Consolas, Monaco, monospace",
  fontWeight: "bold",
};

const valueText = {
  color: "#334155",
  fontWeight: "500",
};

const badge = {
  padding: "3px 10px",
  borderRadius: "9999px",
  fontSize: "10px",
  fontWeight: "bold" as const,
  letterSpacing: "0.5px",
  border: "1px solid",
  display: "inline-block",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "28px 0 16px",
};

const button = {
  display: "inline-block",
  backgroundColor: "#00aeef",
  color: "#ffffff",
  textAlign: "center" as const,
  fontWeight: "bold",
  fontSize: "13px",
  letterSpacing: "0.5px",
  padding: "14px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  boxShadow: "0 2px 4px rgba(0, 174, 239, 0.2)",
};

const hr = {
  borderColor: "#f1f5f9",
  margin: "32px 0 20px 0",
};

const footer = {
  color: "#94a3b8",
  fontSize: "11px",
  lineHeight: "18px",
  textAlign: "center" as const,
  margin: "0",
};
