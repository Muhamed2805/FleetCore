"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

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
import { useRouter } from "@/i18n/navigation";
import { MIN_PASSWORD_LENGTH, passwordErrorKey } from "@/lib/passwords";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm({ email }: { email: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordErrors.mismatch"));
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (error) {
      setError(t(`passwordErrors.${passwordErrorKey(error)}`));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t("resetPassword.title")}</CardTitle>
        <CardDescription>
          {t("resetPassword.description", { email, min: MIN_PASSWORD_LENGTH })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Lets password managers save the new password for this account. */}
          <input type="email" autoComplete="username" value={email} readOnly hidden />
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">{t("resetPassword.newPasswordLabel")}</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">
              {t("resetPassword.confirmPasswordLabel")}
            </Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? t("resetPassword.submitting") : t("resetPassword.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
