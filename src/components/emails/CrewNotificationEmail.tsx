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
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>AquaTrack Dispatch Alert</Heading>
          <Text style={text}>Hello {crewName},</Text>
          <Text style={text}>
            You have been dispatched to investigate an active pipeline anomaly.
          </Text>
          <Section style={alertBox}>
            <Text style={details}>
              <strong>Incident ID:</strong> {incidentId}
            </Text>
            <Text style={details}>
              <strong>Urgency Level:</strong> {urgency}
            </Text>
            <Text style={details}>
              <strong>Description:</strong> {description}
            </Text>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            City of San Fernando Water District (CSFWD) Operations
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #e6ebf1",
  borderRadius: "8px",
};

const h1 = {
  color: "#001e66",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  color: "#525f7f",
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  padding: "0 40px",
};

const alertBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  padding: "16px",
  margin: "20px 40px",
};

const details = {
  color: "#334155",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "4px 0",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0 40px",
};
