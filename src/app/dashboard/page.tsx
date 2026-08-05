import { Bell, Receipt, Truck, Wrench } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("registration_expiry, insurance_expiry, inspection_expiry");

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  const expiringSoon = (vehicles ?? []).filter((vehicle) =>
    [
      vehicle.registration_expiry,
      vehicle.insurance_expiry,
      vehicle.inspection_expiry,
    ].some((date) => date && new Date(date) <= in30Days)
  ).length;

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
        <StatCard title="Open maintenance" value={0} icon={Wrench} hint="No open jobs" />
        <StatCard title="Expenses this month" value="$0" icon={Receipt} />
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
      ) : null}
    </div>
  );
}
