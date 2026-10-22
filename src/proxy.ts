import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const handleI18nRouting = createIntlMiddleware(routing);

// Route handlers under /api and /auth live outside app/[locale]. Running
// the i18n middleware on them rewrites e.g. /auth/signout to
// /en/auth/signout, which doesn't exist and 404s.
const NON_LOCALIZED_PREFIXES = ["/api", "/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isNonLocalized = NON_LOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  const response = isNonLocalized
    ? NextResponse.next({ request })
    : handleI18nRouting(request);
  return await updateSession(request, response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
