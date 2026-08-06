import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { VehiclesTable } from "@/components/vehicles/vehicles-table";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vehicles" };

export default async function VehiclesPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
  }

  const supabase = await createClient();

  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "driver"),
  ]);

  const canManage = profile.role === "admin" || profile.role === "fleet_manager";

  return (
    <VehiclesTable
      vehicles={vehicles ?? []}
      drivers={drivers ?? []}
      companyId={profile.company_id}
      canManage={canManage}
    />
  );
}
