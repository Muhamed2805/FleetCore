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

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

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
        <StatCard title="Vehicles" value={0} icon={Truck} hint="No vehicles yet" />
        <StatCard title="Expiring soon" value={0} icon={Bell} hint="Next 30 days" />
        <StatCard title="Open maintenance" value={0} icon={Wrench} hint="No open jobs" />
        <StatCard title="Expenses this month" value="$0" icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add your first vehicle</CardTitle>
          <CardDescription>
            Vehicle records, documents and maintenance schedules are coming
            in the next phase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button nativeButton={false} render={<Link href="/dashboard/vehicles" />}>
            Go to Vehicles
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
