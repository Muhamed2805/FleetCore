import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { CheckRemindersButton } from "@/components/reminders/check-reminders-button";
import { ReminderSettingsForm } from "@/components/reminders/reminder-settings-form";
import { RemindersList } from "@/components/reminders/reminders-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Reminders" };

export default async function RemindersPage() {
  const t = await getTranslations("reminders");
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
  }

  const supabase = await createClient();

  const [{ data: settings }, { data: notifications }] = await Promise.all([
    supabase
      .from("reminder_settings")
      .select("*")
      .eq("company_id", profile.company_id)
      .single(),
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const vehicleIds = [
    ...new Set((notifications ?? []).map((n) => n.vehicle_id)),
  ];
  const { data: vehicles } =
    vehicleIds.length > 0
      ? await supabase
          .from("vehicles")
          .select("id, make, model, license_plate")
          .in("id", vehicleIds)
      : { data: [] };
  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));

  const notificationsWithVehicle = (notifications ?? []).map(
    (notification) => ({
      ...notification,
      vehicle: vehicleById.get(notification.vehicle_id) ?? null,
    })
  );

  const canManage = profile.role === "admin" || profile.role === "fleet_manager";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("page.title")}</h1>
          <p className="text-muted-foreground">
            {t("page.description")}
          </p>
        </div>
        {canManage ? <CheckRemindersButton /> : null}
      </div>

      {profile.role === "admin" && settings ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {t("settings.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReminderSettingsForm
              companyId={profile.company_id}
              thresholdsDays={settings.thresholds_days}
              emailEnabled={settings.email_enabled}
            />
          </CardContent>
        </Card>
      ) : null}

      <RemindersList notifications={notificationsWithVehicle} />
    </div>
  );
}
