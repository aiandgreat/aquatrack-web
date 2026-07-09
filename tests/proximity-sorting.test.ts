import { expect, test } from "vitest";
import { sortCrewsByProximity, calculateDistance } from "../src/lib/spatial-sorting";
import DiagnosticAlertDrawer from "../src/components/DiagnosticAlertDrawer";

test("sortCrewsByProximity calculates correct distance hierarchy", () => {
  const alertLoc = { lat: 14.5995, lng: 120.9842 };
  const crews = [
    { id: "crew-1", name: "Crew A", latitude: 14.6010, longitude: 120.9850 }, // Farther
    { id: "crew-2", name: "Crew B", latitude: 14.5997, longitude: 120.9843 }, // Closer
  ];

  const sorted = sortCrewsByProximity(alertLoc, crews);
  expect(sorted[0].id).toBe("crew-2");
  expect(sorted[0].distance).toBeLessThan(sorted[1].distance);
});

test("sortCrewsByProximity handles empty crew list", () => {
  const alertLoc = { lat: 14.5995, lng: 120.9842 };
  const sorted = sortCrewsByProximity(alertLoc, []);
  expect(sorted).toEqual([]);
});

test("calculateDistance returns 0 for identical locations", () => {
  const loc = { latitude: 14.5995, longitude: 120.9842 };
  const distance = calculateDistance(loc, loc);
  expect(distance).toBeCloseTo(0, 2);
});

test("calculateDistance calculates approximate distance correctly", () => {
  // Manila City Hall to Manila Cathedral (roughly 900-1000 meters)
  const loc1 = { latitude: 14.5995, longitude: 120.9842 };
  const loc2 = { latitude: 14.5916, longitude: 120.9783 };
  const distance = calculateDistance(loc1, loc2);
  // Expected distance is approx ~1000m to 1200m
  expect(distance).toBeGreaterThan(800);
  expect(distance).toBeLessThan(1500);
});

test("DiagnosticAlertDrawer component is defined", () => {
  expect(DiagnosticAlertDrawer).toBeDefined();
});
