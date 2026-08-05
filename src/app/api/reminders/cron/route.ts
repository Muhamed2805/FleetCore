import { NextResponse } from "next/server";

import { sendReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationCategory } from "@/lib/supabase/types";

const categoryLabels: Record<NotificationCategory, string> = {
  registration: "registration",
  insurance: "insurance",
  inspection: "inspection",
};

// Triggered by an external scheduler (see README) with
// `Authorization: Bearer <CRON_SECRET>`. Scans every company (the admin
// client has no user session, so generate_due_reminders() runs unscoped),
// then emails each newly created notification's recipient.
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: created, error } = await supabase.rpc(
    "generate_due_reminders"
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const notifications = created ?? [];
  if (notifications.length === 0) {
    return NextResponse.json({ created: 0, emailed: 0 });
  }

  const companyIds = [...new Set(notifications.map((n) => n.company_id))];
  const { data: settings } = await supabase
    .from("reminder_settings")
    .select("company_id, email_enabled")
    .in("company_id", companyIds);
  const emailEnabledByCompany = new Map(
    (settings ?? []).map((s) => [s.company_id, s.email_enabled])
  );

  const vehicleIds = [...new Set(notifications.map((n) => n.vehicle_id))];
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, make, model, license_plate")
    .in("id", vehicleIds);
  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));

  let emailed = 0;

  for (const notification of notifications) {
    if (!emailEnabledByCompany.get(notification.company_id)) {
      continue;
    }

    const { data: userResult } = await supabase.auth.admin.getUserById(
      notification.recipient_id
    );
    const email = userResult?.user?.email;
    if (!email) continue;

    const vehicle = vehicleById.get(notification.vehicle_id);
    const vehicleLabel = vehicle
      ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
      : "your vehicle";
    const categoryLabel = categoryLabels[notification.category];

    const result = await sendReminderEmail({
      to: email,
      subject: `${vehicleLabel} — ${categoryLabel} expires in ${notification.threshold_days} day${notification.threshold_days === 1 ? "" : "s"}`,
      text: `${vehicleLabel}'s ${categoryLabel} expires on ${notification.due_date}. This is a reminder sent ${notification.threshold_days} day(s) before expiration.`,
    });

    if (!result.skipped && !result.error) {
      emailed += 1;
      await supabase
        .from("notifications")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", notification.id);
    }
  }

  return NextResponse.json({ created: notifications.length, emailed });
}
