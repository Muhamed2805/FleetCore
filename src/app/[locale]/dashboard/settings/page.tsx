import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { NameForm } from "@/components/settings/name-form";
import { PasswordForm } from "@/components/settings/password-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { getRoleLabels } from "@/lib/team";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const locale = await getLocale();
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale });
    return null;
  }

  const t = await getTranslations("settings");
  const tTeam = await getTranslations("team");
  const email = profile.email ?? "";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("page.title")}</h1>
        <p className="text-muted-foreground">{t("page.description")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("profile.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("profile.emailLabel")}</dt>
              <dd className="font-medium break-all">{email}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("profile.roleLabel")}</dt>
              <dd>
                <Badge variant="secondary">{getRoleLabels(tTeam)[profile.role]}</Badge>
              </dd>
            </div>
          </dl>
          <NameForm field="fullName" initialValue={profile.full_name ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("password.title")}</CardTitle>
          <CardDescription>{t("password.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm email={email} />
        </CardContent>
      </Card>

      {profile.role === "admin" ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("company.title")}</CardTitle>
            <CardDescription>{t("company.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <NameForm field="companyName" initialValue={profile.companyName ?? ""} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
