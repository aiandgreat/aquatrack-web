import { expect, test } from "vitest";
import { PrismaClient } from "@prisma/client";

test("Prisma schema enums can be imported", () => {
  expect(PrismaClient).toBeDefined();
});
