"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_PASSWORD_LENGTH, passwordErrorKey } from "@/lib/passwords";
import { createClient } from "@/lib/supabase/client";

// Runs in the browser, like the login form: Supabase rate-limits sign-in
// attempts per IP, and from the server every user would share one IP.
export function PasswordForm({ email }: { email: string }) {
  const t = useTranslations("settings");
  const tAuth = useTranslations("auth");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(tAuth("passwordErrors.mismatch"));
      return;
    }

    setStatus("saving");
    const supabase = createClient();

    // Confirms the current password before changing it, so an unattended
    // signed-in browser isn't enough to take over the account.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setStatus("idle");
      setError(tAuth(`passwordErrors.${passwordErrorKey(signInError)}`));
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) {
      setStatus("idle");
      setError(tAuth(`passwordErrors.${passwordErrorKey(updateError)}`));
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Lets password managers update the saved password for this account. */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <div className="flex flex-col gap-2">
        <Label htmlFor="current-password">{t("password.currentLabel")}</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">{t("password.newLabel")}</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="max-w-sm"
        />
        <p className="text-xs text-muted-foreground">
          {t("password.hint", { min: MIN_PASSWORD_LENGTH })}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">{t("password.confirmLabel")}</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? t("password.submitting") : t("password.submit")}
        </Button>
        {status === "saved" ? (
          <span className="text-sm text-muted-foreground">{t("password.saved")}</span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
