import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { PASSWORD_RECOVERY_COOKIE } from "@/lib/passwords";
import { createClient } from "@/lib/supabase/server";

// Reached from the password reset email: /auth/callback signs the user in
// and marks the session as a recovery (see PASSWORD_RECOVERY_COOKIE).
export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const cookieStore = await cookies();
  const isRecovery =
    !!user && cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value === user.id;

  if (user && isRecovery) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <ResetPasswordForm email={user.email ?? ""} />
      </div>
    );
  }

  // Signed in normally: the password is changed in Settings, which asks for
  // the current one first.
  const state = user ? "signedIn" : "expired";

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t(`resetPassword.${state}.title`)}</CardTitle>
          <CardDescription>{t(`resetPassword.${state}.description`)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={user ? "/dashboard/settings" : "/forgot-password"}
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            {t(`resetPassword.${state}.action`)}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
