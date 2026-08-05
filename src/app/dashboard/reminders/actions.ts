"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function checkRemindersNow() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_due_reminders");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/reminders");
  return { created: data?.length ?? 0 };
}

export async function updateReminderSettings(
  companyId: string,
  thresholdsDays: number[],
  emailEnabled: boolean
) {
  const supabase = await createClient();

  const cleanThresholds = [
    ...new Set(thresholdsDays.filter((value) => Number.isInteger(value) && value > 0)),
  ].sort((a, b) => b - a);

  const { error } = await supabase
    .from("reminder_settings")
    .update({
      thresholds_days: cleanThresholds,
      email_enabled: emailEnabled,
    })
    .eq("company_id", companyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/reminders");
  return { success: true };
}
