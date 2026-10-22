"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPathname, Link } from "@/i18n/navigation";
import { passwordErrorKey } from "@/lib/passwords";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // The email link signs the user in through /auth/callback, which then
    // opens the reset page in the current locale.
    const next = getPathname({ href: "/reset-password", locale });
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    });

    setIsSubmitting(false);

    // Supabase answers the same way whether or not the account exists, so
    // the page can't be used to find out who has one. Errors here are rate
    // limits and outages.
    if (error) {
      const key = passwordErrorKey(error);
      setError(t(`passwordErrors.${key === "rateLimited" ? "rateLimited" : "generic"}`));
      return;
    }

    setIsSent(true);
  }

  if (isSent) {
    return (
      <AuthShell>
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{t("forgotPassword.sent.title")}</CardTitle>
            <CardDescription>
              {t("forgotPassword.sent.description", { email: email.trim() })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/login"
              className="text-sm font-medium text-foreground underline underline-offset-4"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("forgotPassword.title")}</CardTitle>
          <CardDescription>{t("forgotPassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("forgotPassword.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
