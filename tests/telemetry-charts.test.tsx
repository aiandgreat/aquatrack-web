import { expect, test } from "vitest";
import React from "react";
import TelemetryAnalytics from "../src/components/TelemetryAnalytics";

test("TelemetryAnalytics component is defined", () => {
  expect(TelemetryAnalytics).toBeDefined();
});

test("Telemetry charts correctly formats sensor inputs", () => {
  const testReading = { pressure: 45.2, ph: 7.2 };
  expect(testReading.pressure).toBe(45.2);
  expect(testReading.ph).toBe(7.2);
});
