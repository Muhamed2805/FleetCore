import { Users } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function TeamPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Team"
      description="Invite Fleet Managers, Mechanics and Drivers to your company. Coming in a later phase."
    />
  );
}
