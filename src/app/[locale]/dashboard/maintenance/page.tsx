import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { MaintenanceTable } from "@/components/maintenance/maintenance-table";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
  }

  const supabase = await createClient();

  const [{ data: records }, { data: vehicles }, { data: staff }] =
    await Promise.all([
      supabase
        .from("maintenance_records")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicles")
        .select("id, make, model, license_plate")
        .order("make"),
      supabase.from("profiles").select("id, full_name"),
    ]);

  const canManage =
    profile.role === "admin" ||
    profile.role === "fleet_manager" ||
    profile.role === "mechanic";

  return (
    <MaintenanceTable
      records={records ?? []}
      vehicles={vehicles ?? []}
      staff={staff ?? []}
      companyId={profile.company_id}
      canManage={canManage}
    />
  );
}
