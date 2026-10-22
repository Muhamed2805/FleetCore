import "server-only";

import { Resend } from "resend";

const REMINDERS_FROM = "FleetCore <reminders@fleetcore.app>";
const TEAM_FROM = "FleetCore <team@fleetcore.app>";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

async function sendEmail({ from, to, subject, text }: EmailMessage & { from: string }) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email skipped, no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return { skipped: true as const };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
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

export function sendReminderEmail(message: EmailMessage) {
  return sendEmail({ from: REMINDERS_FROM, ...message });
}

export function sendInvitationEmail(message: EmailMessage) {
  return sendEmail({ from: TEAM_FROM, ...message });
}
