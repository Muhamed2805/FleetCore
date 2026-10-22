import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

// Only the app itself requires a session; signed-out visitors hitting it
// are sent to /login. Everything else stays reachable signed out: the
// landing, login, signup and /invite pages, the /auth and /api route
// handlers (which manage their own auth: session cookies for user-triggered
// routes, a bearer secret for the cron route), and unknown URLs, which
// should 404 rather than bounce to /login. A new page that needs a session
// outside /dashboard must be added here. The dashboard layout re-checks the
// session and RLS guards the data, so this gate is not the only check.
const PROTECTED_PATHS = ["/dashboard"];

// Signed-in users have no use for these and are sent to /dashboard.
const AUTH_PAGES = ["/login", "/signup"];

// Segment-aware prefix match: "/dashboard" matches "/dashboard/vehicles"
// but not "/dashboards".
function matchesAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

// The i18n middleware only prefixes non-default locales (`localePrefix:
// "as-needed"`), so `/login` is English and `/bs/login` is Bosnian. Auth
// gating below needs the prefix stripped to match the path lists above, but
// the prefix must be re-added when building a redirect target so a user
// stays in their own locale.
function splitLocale(pathname: string): { locale: string; path: string } {
  const [, first, ...rest] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(first)) {
    return { locale: first, path: "/" + rest.join("/") };
  }
  return { locale: routing.defaultLocale, path: pathname };
}

function withLocalePrefix(locale: string, path: string) {
  if (locale === routing.defaultLocale) return path;
  return `/${locale}${path === "/" ? "" : path}`;
}

// `response` is the result of next-intl's middleware (a rewrite for
// unprefixed default-locale requests, or a plain "next" otherwise) — it
// must be reused as-is (not replaced) so its locale resolution survives,
// with Supabase's session cookies merged onto it.
export async function updateSession(
  request: NextRequest,
  response: NextResponse
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run logic between createServerClient and getUser() — it
  // refreshes the auth token and must run on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { locale, path } = splitLocale(request.nextUrl.pathname);

  if (!user && matchesAny(path, PROTECTED_PATHS)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePrefix(locale, "/login");
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && matchesAny(path, AUTH_PAGES)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePrefix(locale, "/dashboard");
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
