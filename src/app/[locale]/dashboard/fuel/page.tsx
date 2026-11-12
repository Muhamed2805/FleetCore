import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { FuelLogTable } from "@/components/fuel/fuel-log-table";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fuel" };

export default async function FuelPage({
  searchParams,
}: PageProps<"/[locale]/dashboard/fuel">) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
  }

  const supabase = await createClient();

  const [{ vehicle: vehicleParam }, { data: entries }, { data: vehicles }] =
    await Promise.all([
      searchParams,
      supabase
        .from("fuel_entries")
        .select("*")
        .order("filled_on", { ascending: false })
        .order("odometer", { ascending: false }),
      supabase
        .from("vehicles")
        .select("id, make, model, license_plate, odometer, assigned_driver_id")
        .order("make"),
    ]);

  const canManage = profile.role === "admin" || profile.role === "fleet_manager";
  // Mirrors the insert policy on fuel_entries.
  const loggableVehicleIds = (vehicles ?? [])
    .filter(
      (vehicle) => canManage || vehicle.assigned_driver_id === profile.id
    )
    .map((vehicle) => vehicle.id);

  return (
    <FuelLogTable
      entries={entries ?? []}
      vehicles={vehicles ?? []}
      loggableVehicleIds={loggableVehicleIds}
      companyId={profile.company_id}
      profileId={profile.id}
      canManage={canManage}
      initialVehicleId={typeof vehicleParam === "string" ? vehicleParam : undefined}
    />
  );
}
