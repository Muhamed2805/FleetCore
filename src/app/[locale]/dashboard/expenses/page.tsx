import type { Metadata } from "next";
import { getLocale } from "next-intl/server";

import { ExpensesTable } from "@/components/expenses/expenses-table";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
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
