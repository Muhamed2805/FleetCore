import { Bell, Receipt, Truck, Wrench } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { FleetCompositionChart } from "@/components/dashboard/fleet-composition-chart";
import { SpendTrendChart } from "@/components/dashboard/spend-trend-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/expenses";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { VehicleType } from "@/lib/supabase/types";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short" });
}

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().slice(0, 10);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().slice(0, 10);

  const [
    { data: vehicles },
    { count: openMaintenanceCount },
    { data: expensesThisMonth },
    { data: expensesLast6Months },
    { data: maintenanceLast6Months },
  ] = await Promise.all([
    supabase
      .from("vehicles")
      .select("type, registration_expiry, insurance_expiry, inspection_expiry"),
    supabase
      .from("maintenance_records")
      .select("*", { count: "exact", head: true })
      .in("status", ["scheduled", "in_progress"]),
    supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", startOfMonthStr),
    supabase
      .from("expenses")
      .select("amount, expense_date")
      .gte("expense_date", sixMonthsAgoStr),
    supabase
      .from("maintenance_records")
      .select("cost, completed_date")
      .eq("status", "completed")
      .gte("completed_date", sixMonthsAgoStr),
  ]);

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiringSoon = (vehicles ?? []).filter((vehicle) =>
    [
      vehicle.registration_expiry,
      vehicle.insurance_expiry,
      vehicle.inspection_expiry,
    ].some((date) => date && new Date(date) <= in30Days)
  ).length;

  const expensesThisMonthTotal = (expensesThisMonth ?? []).reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const fleetCounts = (vehicles ?? []).reduce(
    (acc, vehicle) => {
      acc[vehicle.type] = (acc[vehicle.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<VehicleType, number>
  );

  const months: { key: string; label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);
    months.push({ key: monthKey(date), label: monthLabel(date), total: 0 });
  }
  const monthByKey = new Map(months.map((m) => [m.key, m]));

  for (const expense of expensesLast6Months ?? []) {
    const month = monthByKey.get(monthKey(new Date(expense.expense_date)));
    if (month) month.total += expense.amount;
  }
  for (const record of maintenanceLast6Months ?? []) {
    if (!record.completed_date || !record.cost) continue;
    const month = monthByKey.get(monthKey(new Date(record.completed_date)));
    if (month) month.total += record.cost;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your fleet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Vehicles"
          value={vehicles?.length ?? 0}
          icon={Truck}
          hint={vehicles?.length ? undefined : "No vehicles yet"}
        />
        <StatCard
          title="Expiring soon"
          value={expiringSoon}
          icon={Bell}
          hint="Next 30 days"
        />
        <StatCard
          title="Open maintenance"
          value={openMaintenanceCount ?? 0}
          icon={Wrench}
          hint={openMaintenanceCount ? undefined : "No open jobs"}
        />
        <StatCard
          title="Expenses this month"
          value={formatCurrency(expensesThisMonthTotal)}
          icon={Receipt}
        />
      </div>

      {!vehicles?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Add your first vehicle</CardTitle>
            <CardDescription>
              Register cars, vans, trucks, machinery and forklifts to start
              tracking documents and expirations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/dashboard/vehicles" />}>
              Go to Vehicles
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <FleetCompositionChart counts={fleetCounts} />
          <SpendTrendChart data={months} />
        </div>
      )}
    </div>
  );
}
