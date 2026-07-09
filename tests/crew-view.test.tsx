import { expect, test } from "vitest";
import React from "react";
import FieldCrewPortal from "../src/app/crew/page";

test("Crew view successfully exports mobile components", () => {
  expect(FieldCrewPortal).toBeDefined();
});
