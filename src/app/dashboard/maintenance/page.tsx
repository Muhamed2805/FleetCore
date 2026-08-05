import { Wrench } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function MaintenancePage() {
  return (
    <ComingSoon
      icon={Wrench}
      title="Maintenance"
      description="Maintenance schedules and service history for your fleet. Coming in a later phase."
    />
  );
}
