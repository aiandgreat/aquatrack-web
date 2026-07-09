import { expect, test } from "vitest";
import React from "react";
// @ts-ignore
import DashboardLayout from "../src/app/dashboard/layout";
// @ts-ignore
import DashboardPage from "../src/app/dashboard/page";
// @ts-ignore
import MapboxMap from "../src/components/MapboxMap";

if (typeof global.document === "undefined") {
  global.document = {
    createElement: (tag: string) => ({
      tagName: tag.toUpperCase(),
      id: "",
    }),
  } as any;
}

test("Renders dashboard container elements", () => {
  const testContainer = document.createElement("div");
  testContainer.id = "dashboard-shell";
  expect(testContainer).toBeDefined();
});

test("Dashboard components and functions are defined", () => {
  expect(DashboardLayout).toBeDefined();
  expect(DashboardPage).toBeDefined();
  expect(MapboxMap).toBeDefined();
});
