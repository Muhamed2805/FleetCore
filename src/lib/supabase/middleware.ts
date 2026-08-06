import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

// /api routes manage their own auth (session cookies for user-triggered
// routes, a bearer secret for the cron route) rather than the
// redirect-to-/login gate below.
const PUBLIC_PATHS = ["/login", "/signup", "/auth", "/api"];

// The i18n middleware only prefixes non-default locales (`localePrefix:
// "as-needed"`), so `/login` is English and `/bs/login` is Bosnian. Auth
// gating below needs the prefix stripped to match PUBLIC_PATHS, but the
// prefix must be re-added when building a redirect target so a user stays
// in their own locale.
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
  const isPublicPath = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublicPath && path !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePrefix(locale, "/login");
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = withLocalePrefix(locale, "/dashboard");
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
