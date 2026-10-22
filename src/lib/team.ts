import type { UserRole } from "@/lib/supabase/types";

export const userRoles: UserRole[] = [
  "admin",
  "fleet_manager",
  "mechanic",
  "driver",
];

export const INVITATION_TTL_DAYS = 7;

type Translate = (key: string) => string;

// `t` must be scoped to the "team" namespace.
export function getRoleLabels(t: Translate): Record<UserRole, string> {
  return {
    admin: t("roles.admin"),
    fleet_manager: t("roles.fleetManager"),
    mechanic: t("roles.mechanic"),
    driver: t("roles.driver"),
  };
}
