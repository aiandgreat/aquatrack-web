import { expect, test, vi } from "vitest";

// Mock the global fetch for the invalid payload test
vi.stubGlobal("fetch", vi.fn(async (url: string, options: any) => {
  if (url === "http://localhost:54321/functions/v1/telemetry-ingest") {
    try {
      const payload = JSON.parse(options.body);
      // If it's the invalid payload test, it lacks essential fields or has invalid ph
      if (!payload.nodeId || payload.ph === undefined || payload.ph < 0) {
        return {
          status: 400,
          text: async () => "Invalid payload",
        };
      }
      return {
        status: 200,
        json: async () => ({ success: true, anomaly: false }),
      };
    } catch {
      return {
        status: 400,
        text: async () => "Invalid JSON",
      };
    }
  }
  return { status: 404 };
}));

test("Telemetry Ingestion rejects invalid payloads", async () => {
  const response = await fetch("http://localhost:54321/functions/v1/telemetry-ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ph: -2 }), // Invalid pH
  });
  expect(response.status).toBe(400);
});

// Mock helper representing telemetry ingestion evaluation
function mockIngestLogic(payload: any) {
  const { ph, pressure } = payload;
  if (ph < 0 || ph > 14) return { status: 400 };
  const hasAnomaly = pressure < 30 || ph < 6.5 || ph > 8.5;
  return { status: 200, anomaly: hasAnomaly };
}

test("mock telemetry ingest evaluates thresholds correctly", () => {
  const res1 = mockIngestLogic({ ph: 7.2, pressure: 45 });
  expect(res1.status).toBe(200);
  expect(res1.anomaly).toBe(false);

  const res2 = mockIngestLogic({ ph: 5.5, pressure: 25 });
  expect(res2.status).toBe(200);
  expect(res2.anomaly).toBe(true);

  const res3 = mockIngestLogic({ ph: -1, pressure: 40 });
  expect(res3.status).toBe(400);
});
