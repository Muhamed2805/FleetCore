import { NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import {
  PASSWORD_RECOVERY_COOKIE,
  PASSWORD_RECOVERY_MAX_AGE,
} from "@/lib/passwords";
import { safeNextPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// `next` keeps its locale prefix ("/bs/reset-password"); a failed link goes
// to the login page in that same locale.
function loginPathFor(next: string) {
  const locale = routing.locales.find(
    (l) => l !== routing.defaultLocale && (next === `/${l}` || next.startsWith(`/${l}/`))
  );
  return locale ? `/${locale}/login` : "/login";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // auth-js reports which flow the code came from ("recovery" for a
      // password reset email) but leaves it out of its types.
      const { redirectType } = data as { redirectType?: string | null };
      if (redirectType === "recovery") {
        response.cookies.set(PASSWORD_RECOVERY_COOKIE, data.user.id, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: PASSWORD_RECOVERY_MAX_AGE,
        });
      }
      return response;
    }
  }

  // No code (Supabase sends expired links here with only an error) or the
  // exchange failed: expired, already used, or opened in another browser.
  return NextResponse.redirect(`${origin}${loginPathFor(next)}?error=link`);
}
