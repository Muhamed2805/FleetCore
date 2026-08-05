import { Users } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <ComingSoon
      icon={Users}
      title="Team"
      description="Invite Fleet Managers, Mechanics and Drivers to your company. Coming in a later phase."
    />
  );
}
