import { Bell } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function RemindersPage() {
  return (
    <ComingSoon
      icon={Bell}
      title="Reminders"
      description="Customizable email and in-app reminders before registrations, insurance and inspections expire. Coming in a later phase."
    />
  );
}
