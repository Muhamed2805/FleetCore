import { NextResponse } from "next/server";

import { sendReminderEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationCategory } from "@/lib/supabase/types";

const categoryLabels: Record<NotificationCategory, string> = {
  registration: "registration",
  insurance: "insurance",
  inspection: "inspection",
};

// Notifications created by the "Check now" button never went through
// this route, so emailing only the rows the scan below returns would skip
// them. Anything created in this window and not yet emailed is sent; the
// window keeps a company that turns email on later from receiving a
// backlog of old reminders.
const EMAIL_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

// Triggered by an external scheduler (see README) with
// `Authorization: Bearer <CRON_SECRET>`. Scans every company (the admin
// client has no user session, so generate_due_reminders() runs unscoped),
// then emails every recipient whose notification hasn't been emailed yet.
export async function POST(request: Request) {
  // Reject when CRON_SECRET is unset too — otherwise the expected header
  // would be the literal string "Bearer undefined".
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: created, error } = await supabase.rpc(
    "generate_due_reminders"
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: pending, error: pendingError } = await supabase
    .from("notifications")
    .select("*")
    .is("email_sent_at", null)
    .gte("created_at", new Date(Date.now() - EMAIL_WINDOW_MS).toISOString());

  if (pendingError) {
    return NextResponse.json({ error: pendingError.message }, { status: 500 });
  }

  const createdCount = created?.length ?? 0;
  const notifications = pending ?? [];
  if (notifications.length === 0) {
    return NextResponse.json({ created: createdCount, emailed: 0 });
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

  return NextResponse.json({ created: createdCount, emailed });
}
