import { expect, test } from "@playwright/test";

import { safeNextPath } from "../src/lib/safe-redirect";

// Plain unit checks; no page or server involved.
test.describe("safeNextPath", () => {
  test("keeps same-site paths", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/bs/dashboard/vehicles")).toBe("/bs/dashboard/vehicles");
    expect(safeNextPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
  });

  test("falls back for anything that could leave the site", () => {
    for (const next of [
      null,
      undefined,
      "",
      "//evil.com",
      "/\\evil.com",
      "https://evil.com",
      "@evil.com",
      "evil.com",
      "javascript:alert(1)",
    ]) {
      expect(safeNextPath(next)).toBe("/dashboard");
    }
    expect(safeNextPath("//evil.com", "")).toBe("");
  });
});
