"use client";

import { useTranslations } from "next-intl";
import { useRouter as useAppRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

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
import { Link, useRouter } from "@/i18n/navigation";
import { safeNextPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const appRouter = useAppRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Set by /auth/callback when an email link is expired or already used.
  const linkError = searchParams.get("error") === "link";
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    // `next` is the full path the proxy bounced, locale prefix included
    // ("/bs/dashboard/vehicles"), so it goes to the plain router; the
    // localized one would prefix it again. Without it, the localized router
    // picks the current locale's dashboard.
    const next = safeNextPath(searchParams.get("next"), "");
    if (next) {
      appRouter.push(next);
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <AuthShell>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("login.title")}</CardTitle>
          <CardDescription>{t("login.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {linkError && !error ? (
              <p className="text-sm text-destructive">{t("login.linkError")}</p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">{t("login.emailLabel")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="password">{t("login.passwordLabel")}</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t("login.forgotPasswordLink")}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
              {t("login.createAccountLink")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
