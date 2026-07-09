import { expect, test, vi } from "vitest";
import { sendCrewNotification } from "../src/lib/resend";

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn().mockImplementation(async (payload) => {
          if (!payload.to) {
            return { error: { message: "Missing email" } };
          }
          if (payload.to === "error@district.gov") {
            return { error: { message: "Resend API error" } };
          }
          if (payload.to === "throw@district.gov") {
            throw new Error("Network connection failed");
          }
          return { data: { id: "resend-email-id-123" } };
        })
      }
    }))
  };
});

test("sendCrewNotification returns status 400 (success: false) for empty emails", async () => {
  const result = await sendCrewNotification("", "Alert", "<p>Content</p>");
  expect(result.success).toBe(false);
  expect(result.error).toBe("Recipient email is required");
});

test("mocked resend matches success cases", async () => {
  const resultOk = await sendCrewNotification("crew1@district.gov", "Incident", "<h1>Alert</h1>");
  expect(resultOk.success).toBe(true);
  expect(resultOk.id).toBe("resend-email-id-123");
});

test("sendCrewNotification handles Resend API errors", async () => {
  const resultErr = await sendCrewNotification("error@district.gov", "Incident", "<h1>Alert</h1>");
  expect(resultErr.success).toBe(false);
  expect(resultErr.error).toBe("Resend API error");
});

test("sendCrewNotification handles Resend API unexpected exceptions", async () => {
  const resultThrow = await sendCrewNotification("throw@district.gov", "Incident", "<h1>Alert</h1>");
  expect(resultThrow.success).toBe(false);
  expect(resultThrow.error).toBe("Network connection failed");
});

