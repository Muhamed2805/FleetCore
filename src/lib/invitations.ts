import "server-only";

import { headers } from "next/headers";

import { getPathname } from "@/i18n/navigation";

// Server-only. Public origin of the current request — behind a proxy
// (e.g. Vercel) the forwarded headers carry the public host and protocol.
async function getRequestOrigin() {
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
  const origin = await getRequestOrigin();
  return origin + getPathname({ href: `/invite/${token}`, locale });
}
