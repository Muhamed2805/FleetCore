import { redirect } from "next/navigation";

import { VehiclesTable } from "@/components/vehicles/vehicles-table";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function VehiclesPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
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
