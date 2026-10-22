import "server-only";

import { headers } from "next/headers";

import { getPathname } from "@/i18n/navigation";

// Public origin for links that leave the app (invite emails).
//
// SITE_URL is the trusted value. Without it the origin comes from the
// request's Host / X-Forwarded-Host headers, which the client controls when
// nothing in front of the app overwrites them, so an emailed link could
// point at another domain. The fallback is for local development; set
// SITE_URL in every deployment.
async function getSiteOrigin() {
  const configured = process.env.SITE_URL?.trim();
  if (configured) {
    return new URL(configured).origin;
  }

  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${protocol}://${host}`;
}

// Absolute link to the invite page, in the given locale (the default
// locale has no prefix).
export async function getInviteUrl(token: string, locale: string) {
  const origin = await getSiteOrigin();
  return origin + getPathname({ href: `/invite/${token}`, locale });
}
