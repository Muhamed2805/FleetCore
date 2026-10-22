"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

// Same rule as the profiles_full_name_check and companies_name_check
// constraints in the database.
const nameSchema = z.string().trim().min(1).max(100);

// The dashboard header shows both names (company name, user menu), so the
// whole dashboard layout is refreshed, not only the Settings page.
function refreshDashboard() {
  revalidatePath("/[locale]/dashboard", "layout");
}

export async function updateProfileName(fullName: string) {
  const t = await getTranslations("settings");
  const profile = await getCurrentProfile();
  if (!profile) return { error: t("errors.notSignedIn") };

  const parsed = nameSchema.safeParse(fullName);
  if (!parsed.success) return { error: t("errors.invalidName") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data })
    .eq("id", profile.id)
    .select("id");
  if (error || !data?.length) return { error: t("errors.generic") };

  refreshDashboard();
  return { success: true };
}

// Server actions are reachable by direct POST, so the role is checked here
// too; RLS and the column grant enforce the same rule in the database.
export async function updateCompanyName(name: string) {
  const t = await getTranslations("settings");
  const profile = await getCurrentProfile();
  if (!profile) return { error: t("errors.notSignedIn") };
  if (profile.role !== "admin") return { error: t("errors.notAllowed") };

  const parsed = nameSchema.safeParse(name);
  if (!parsed.success) return { error: t("errors.invalidCompanyName") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .update({ name: parsed.data })
    .eq("id", profile.company_id)
    .select("id");
  if (error || !data?.length) return { error: t("errors.generic") };

  refreshDashboard();
  return { success: true };
}
