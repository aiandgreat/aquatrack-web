import { expect, test, vi, beforeEach } from "vitest";

// Set env vars BEFORE importing the module so top-level `const apiKey` picks them up
vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
vi.stubEnv("BREVO_SENDER_EMAIL", "test@aquatrack.gov");

import { sendCrewNotification, sendReactEmailNotification } from "../src/lib/resend";

// Mock global fetch to simulate Brevo API responses
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── sendCrewNotification ────────────────────────────────────────────────────

test("sendCrewNotification returns status 400 (success: false) for empty emails", async () => {
  const result = await sendCrewNotification("", "Alert", "<p>Content</p>");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Recipient email is required");
});

test("sendCrewNotification successfully sends via Brevo API", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ messageId: "brevo-msg-id-123" }),
  });

  const result = await sendCrewNotification("crew1@district.gov", "Incident", "<h1>Alert</h1>");
  expect(result.success).toBe(true);
  expect(result.id).toBe("brevo-msg-id-123");
});

test("sendCrewNotification handles Brevo API errors (non-ok response)", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({ message: "Brevo API error" }),
  });

  const result = await sendCrewNotification("error@district.gov", "Incident", "<h1>Alert</h1>");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Brevo API error");
});

test("sendCrewNotification handles unexpected network exceptions", async () => {
  mockFetch.mockRejectedValueOnce(new Error("Network connection failed"));

  const result = await sendCrewNotification("throw@district.gov", "Incident", "<h1>Alert</h1>");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Network connection failed");
});

// ─── sendReactEmailNotification ──────────────────────────────────────────────

test("sendReactEmailNotification returns status 400 (success: false) for empty emails", async () => {
  const result = await sendReactEmailNotification("", "Alert", {
    crewName: "Santos",
    incidentId: "123",
    urgency: "HIGH",
    description: "Leak",
  });
  expect(result.success).toBe(false);
  expect(result.error).toBe("Recipient email is required");
});

test("sendReactEmailNotification successfully sends email using React Email component template", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ messageId: "brevo-msg-id-123" }),
  });

  const result = await sendReactEmailNotification("crew1@district.gov", "Alert", {
    crewName: "Santos",
    incidentId: "123",
    urgency: "HIGH",
    description: "Leak",
  });
  expect(result.success).toBe(true);
  expect(result.id).toBe("brevo-msg-id-123");
});
