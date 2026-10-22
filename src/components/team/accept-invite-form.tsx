"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/passwords";
import { createClient } from "@/lib/supabase/client";

export function AcceptInviteForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const t = useTranslations("team");
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // handle_new_user() reads invite_token and joins the inviting
        // company instead of creating a new one.
        data: { full_name: fullName, invite_token: token },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsSubmitting(false);

    if (error) {
      // The signup trigger rejecting the invite surfaces as a generic
      // database error from Supabase Auth.
      setError(
        /database error/i.test(error.message)
          ? t("invite.errors.rejected")
          : error.message
      );
      return;
    }

    // With email confirmation on, Supabase hides "already registered" by
    // returning a user with no identities instead of an error.
    if (data.user && data.user.identities?.length === 0) {
      setError(t("invite.errors.emailTaken"));
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setIsSubmitted(true);
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-medium">{t("invite.checkInbox.title")}</p>
        <p className="text-sm text-muted-foreground">
          {t("invite.checkInbox.description", { email })}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t("invite.emailLabel")}</Label>
        <Input id="email" type="email" value={email} readOnly disabled />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">{t("invite.fullNameLabel")}</Label>
        <Input
          id="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t("invite.passwordLabel")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isSubmitting} className="mt-2">
        {isSubmitting ? t("invite.submitting") : t("invite.submit")}
      </Button>
    </form>
  );
}

// Shown when someone opens an invite while signed in to another account:
// signs out in place so the page re-renders with the signup form.
export function SignOutToAcceptButton() {
  const t = useTranslations("team");
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await createClient().auth.signOut();
    router.refresh();
  }

  return (
    <Button variant="outline" disabled={isSigningOut} onClick={handleSignOut}>
      {t("invite.signOutToAccept")}
    </Button>
  );
}
