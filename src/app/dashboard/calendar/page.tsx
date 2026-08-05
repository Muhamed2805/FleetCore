import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CalendarView } from "@/components/calendar/calendar-view";
import type { CalendarEvent } from "@/lib/calendar";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: vehicles }, { data: maintenanceRecords }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, make, model, license_plate, registration_expiry, insurance_expiry, inspection_expiry"),
    supabase
      .from("maintenance_records")
      .select("id, title, vehicle_id, scheduled_date")
      .in("status", ["scheduled", "in_progress"])
      .not("scheduled_date", "is", null),
  ]);

  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));

  const events: CalendarEvent[] = [];

  for (const vehicle of vehicles ?? []) {
    const vehicleLabel = `${vehicle.make} ${vehicle.model}`;
    if (vehicle.registration_expiry) {
      events.push({
        id: `${vehicle.id}-registration`,
        date: vehicle.registration_expiry,
        type: "registration",
        title: `${vehicleLabel} — registration`,
        href: `/dashboard/vehicles/${vehicle.id}`,
      });
    }
    if (vehicle.insurance_expiry) {
      events.push({
        id: `${vehicle.id}-insurance`,
        date: vehicle.insurance_expiry,
        type: "insurance",
        title: `${vehicleLabel} — insurance`,
        href: `/dashboard/vehicles/${vehicle.id}`,
      });
    }
    if (vehicle.inspection_expiry) {
      events.push({
        id: `${vehicle.id}-inspection`,
        date: vehicle.inspection_expiry,
        type: "inspection",
        title: `${vehicleLabel} — inspection`,
        href: `/dashboard/vehicles/${vehicle.id}`,
      });
    }
  }

  for (const record of maintenanceRecords ?? []) {
    if (!record.scheduled_date) continue;
    const vehicle = vehicleById.get(record.vehicle_id);
    events.push({
      id: `maintenance-${record.id}`,
      date: record.scheduled_date,
      type: "maintenance",
      title: vehicle
        ? `${record.title} — ${vehicle.make} ${vehicle.model}`
        : record.title,
      href: "/dashboard/maintenance",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Upcoming expirations and scheduled maintenance.
        </p>
      </div>
      <CalendarView events={events} />
    </div>
  );
}
