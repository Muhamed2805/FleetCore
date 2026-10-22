import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { routing } from "../src/i18n/routing";

// Smoke tests: every public page renders in every locale, protected pages
// redirect to login, and the route handlers outside app/[locale] respond
// instead of 404ing. None of them need a session, so CI runs them against
// a placeholder Supabase URL (see .github/workflows/ci.yml).

// Reads a message straight from messages/<locale>/<namespace>.json, so the
// assertions follow the translations instead of duplicating them.
function t(locale: string, namespace: string, key: string): string {
  const file = path.join(process.cwd(), "messages", locale, `${namespace}.json`);
  let value: unknown = JSON.parse(readFileSync(file, "utf8"));
  for (const part of key.split(".")) {
    value = (value as Record<string, unknown> | undefined)?.[part];
  }
  if (typeof value !== "string") {
    throw new Error(`Missing message ${locale}/${namespace}.json: ${key}`);
  }
  return value;
}

// The default locale has no URL prefix (`localePrefix: "as-needed"`).
function localized(locale: string, pathname: string) {
  return locale === routing.defaultLocale ? pathname : `/${locale}${pathname}`;
}

test.describe("public pages", () => {
  test("landing page links to login", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/FleetCore/);

    // Base UI's Button renders this <a> with role="button", so match by text.
    await page
      .getByRole("banner")
      .getByText(t("en", "landing", "header.logIn"), { exact: true })
      .click();
    await expect(page).toHaveURL(/\/login$/);
  });

  for (const locale of routing.locales) {
    test(`login page renders in ${locale}`, async ({ page }) => {
      const response = await page.goto(localized(locale, "/login"));
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(
        page.getByText(t(locale, "auth", "login.title"), { exact: true })
      ).toBeVisible();
      await expect(page.getByLabel(t(locale, "auth", "login.emailLabel"))).toBeVisible();
      await expect(page.getByLabel(t(locale, "auth", "login.passwordLabel"))).toBeVisible();
    });
  }

  test("signup page renders the form", async ({ page }) => {
    await page.goto("/signup");
    for (const key of [
      "signup.companyNameLabel",
      "signup.fullNameLabel",
      "signup.emailLabel",
      "signup.passwordLabel",
    ]) {
      await expect(page.getByLabel(t("en", "auth", key))).toBeVisible();
    }
  });
});

test.describe("auth gate", () => {
  test("dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);
  });

  test("redirect keeps the locale", async ({ page }) => {
    await page.goto("/bs/dashboard/vehicles");
    await expect(page).toHaveURL(/\/bs\/login\?next=%2Fbs%2Fdashboard%2Fvehicles$/);
  });

  test("team page redirects to login", async ({ page }) => {
    await page.goto("/dashboard/team");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fteam$/);
  });
});

test.describe("invite page", () => {
  test("malformed token shows invitation not found", async ({ page }) => {
    await page.goto("/invite/not-a-token");
    await expect(
      page.getByText(t("en", "team", "invite.invalid.title"), { exact: true })
    ).toBeVisible();
  });

  test("unknown token shows invitation not found, localized", async ({ page }) => {
    await page.goto("/bs/invite/00000000-0000-4000-8000-000000000000");
    await expect(
      page.getByText(t("bs", "team", "invite.invalid.title"), { exact: true })
    ).toBeVisible();
  });
});

test.describe("route handlers", () => {
  test("sign out redirects to login", async ({ request }) => {
    const response = await request.post("/auth/signout", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/\/login$/);
  });

  test("auth callback without a code redirects to login", async ({ request }) => {
    const response = await request.get("/auth/callback", { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/\/login$/);
  });

  test("reminders cron rejects requests without the secret", async ({ request }) => {
    const missing = await request.post("/api/reminders/cron");
    expect(missing.status()).toBe(401);

    const wrong = await request.post("/api/reminders/cron", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(wrong.status()).toBe(401);

    // CI runs without CRON_SECRET, so this catches a route that compares
    // against an unset secret ("Bearer undefined").
    const undefinedSecret = await request.post("/api/reminders/cron", {
      headers: { authorization: "Bearer undefined" },
    });
    expect(undefinedSecret.status()).toBe(401);
  });
});
