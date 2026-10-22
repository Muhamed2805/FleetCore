import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { routing } from "../src/i18n/routing";

// Smoke tests: every public page renders in every locale, protected pages
// redirect to login, unknown URLs get a localized 404, and the route
// handlers outside app/[locale] respond instead of 404ing. None of them need a session, so CI runs them against
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

    await expect(
      page.getByRole("link", { name: t("en", "landing", "hero.getStarted") })
    ).toHaveAttribute("href", "/signup");

    await page.getByRole("link", { name: t("en", "landing", "header.logIn") }).click();
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
      await expect(
        page.getByRole("link", { name: t(locale, "auth", "login.forgotPasswordLink") })
      ).toHaveAttribute("href", localized(locale, "/forgot-password"));
    });

    test(`forgot password page renders in ${locale}`, async ({ page }) => {
      const response = await page.goto(localized(locale, "/forgot-password"));
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(
        page.getByText(t(locale, "auth", "forgotPassword.title"), { exact: true })
      ).toBeVisible();
      await expect(
        page.getByLabel(t(locale, "auth", "forgotPassword.emailLabel"))
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: t(locale, "auth", "forgotPassword.submit") })
      ).toBeVisible();
    });
  }

  test("login explains an expired email link", async ({ page }) => {
    await page.goto("/bs/login?error=link");
    await expect(
      page.getByText(t("bs", "auth", "login.linkError"), { exact: true })
    ).toBeVisible();
  });

  test("reset password page without a session offers a new link", async ({ page }) => {
    for (const locale of ["en", "bs"]) {
      const response = await page.goto(localized(locale, "/reset-password"));
      expect(response?.status()).toBe(200);
      await expect(
        page.getByText(t(locale, "auth", "resetPassword.expired.title"), { exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: t(locale, "auth", "resetPassword.expired.action") })
      ).toHaveAttribute("href", localized(locale, "/forgot-password"));
    }
  });

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

  test("unknown route returns 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { name: t("en", "dashboard-shell", "appNotFound.title") })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: t("en", "dashboard-shell", "appNotFound.goHome") })
    ).toHaveAttribute("href", "/");
  });

  test("unknown route 404 is localized", async ({ page }) => {
    const response = await page.goto("/de/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(
      page.getByRole("heading", { name: t("de", "dashboard-shell", "appNotFound.title") })
    ).toBeVisible();
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

  test("settings page redirects to login", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fsettings$/);
  });

  test("documents page redirects to login", async ({ page }) => {
    await page.goto("/dashboard/documents");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fdocuments$/);
  });

  test("unknown dashboard route still redirects to login", async ({ page }) => {
    await page.goto("/dashboard/does-not-exist");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Fdoes-not-exist$/);
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
    expect(response.headers().location).toMatch(/\/login\?error=link$/);
  });

  test("auth callback with a bad code keeps the link's locale", async ({ request }) => {
    const response = await request.get(
      "/auth/callback?code=not-a-code&next=%2Fbs%2Freset-password",
      { maxRedirects: 0 }
    );
    expect(response.status()).toBe(307);
    expect(response.headers().location).toMatch(/\/bs\/login\?error=link$/);
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

test.describe("security headers", () => {
  test("pages refuse to be framed and don't leak referrers", async ({ request }) => {
    const response = await request.get("/login");
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
