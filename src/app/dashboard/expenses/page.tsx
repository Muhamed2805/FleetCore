import { redirect } from "next/navigation";

import { ExpensesTable } from "@/components/expenses/expenses-table";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function ExpensesPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: expenses }, { data: vehicles }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false }),
    supabase
      .from("vehicles")
      .select("id, make, model, license_plate")
      .order("make"),
  ]);

  const canManage = profile.role === "admin" || profile.role === "fleet_manager";

  return (
    <ExpensesTable
      expenses={expenses ?? []}
      vehicles={vehicles ?? []}
      companyId={profile.company_id}
      canManage={canManage}
    />
  );
}
