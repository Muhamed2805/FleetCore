import { Resend } from "resend";

const FROM_ADDRESS = "FleetCore <reminders@fleetcore.app>";

export async function sendReminderEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email skipped, no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return { skipped: true as const };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    text,
  });

  if (error) {
    console.error(`[email failed] to=${to}:`, error.message);
    return { skipped: false as const, error: error.message };
  }

  return { skipped: false as const };
}
