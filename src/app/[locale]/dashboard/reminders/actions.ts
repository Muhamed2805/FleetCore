"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

// The route as Next.js sees it; every locale is a value of [locale].
const REMINDERS_PAGE = "/[locale]/dashboard/reminders";

const MAX_THRESHOLD_DAYS = 365;
const MAX_THRESHOLDS = 10;

const thresholdsSchema = z
  .array(z.number().int().min(1).max(MAX_THRESHOLD_DAYS))
  .transform((days) => [...new Set(days)].sort((a, b) => b - a))
  .pipe(z.array(z.number()).max(MAX_THRESHOLDS));

export async function checkRemindersNow() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_due_reminders");

  if (error) {
    return { error: error.message };
  }

  revalidatePath(REMINDERS_PAGE, "page");
  return { created: data?.length ?? 0 };
}

// The company comes from the caller's session, never from the client.
// RLS would block another company's row anyway, but silently (0 rows
// updated, no error), which the form would report as saved.
export async function updateReminderSettings(
  thresholdsDays: number[],
  emailEnabled: boolean
) {
  const t = await getTranslations("reminders.settings.errors");
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return { error: t("notAllowed") };
  }

  const thresholds = thresholdsSchema.safeParse(thresholdsDays);
  if (!thresholds.success) {
    return {
      error: t("invalidDays", {
        max: MAX_THRESHOLD_DAYS,
        count: MAX_THRESHOLDS,
      }),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("reminder_settings")
    .update({
      thresholds_days: thresholds.data,
      email_enabled: emailEnabled === true,
    })
    .eq("company_id", profile.company_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(REMINDERS_PAGE, "page");
  return { success: true };
}
