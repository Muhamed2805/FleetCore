import { Calendar } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function CalendarPage() {
  return (
    <ComingSoon
      icon={Calendar}
      title="Calendar"
      description="See upcoming expirations, inspections and maintenance in one calendar view. Coming in a later phase."
    />
  );
}
