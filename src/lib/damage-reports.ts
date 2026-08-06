import type { DamageReportStatus, DamageSeverity } from "@/lib/supabase/types";

export const damageSeverityLabels: Record<DamageSeverity, string> = {
  minor: "Minor",
  moderate: "Moderate",
  severe: "Severe",
};

export const damageSeverityBadgeVariant: Record<
  DamageSeverity,
  "default" | "secondary" | "destructive" | "outline"
> = {
  minor: "outline",
  moderate: "secondary",
  severe: "destructive",
};

export const damageStatusLabels: Record<DamageReportStatus, string> = {
  reported: "Reported",
  scheduled: "Scheduled",
  in_repair: "In repair",
  resolved: "Resolved",
};

export const damageStatusBadgeVariant: Record<
  DamageReportStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  reported: "secondary",
  scheduled: "outline",
  in_repair: "default",
  resolved: "outline",
};

type Translate = (key: string) => string;

export function getDamageSeverityLabels(
  t: Translate
): Record<DamageSeverity, string> {
  return {
    minor: t("enums.severity.minor"),
    moderate: t("enums.severity.moderate"),
    severe: t("enums.severity.severe"),
  };
}

export function getDamageStatusLabels(
  t: Translate
): Record<DamageReportStatus, string> {
  return {
    reported: t("enums.status.reported"),
    scheduled: t("enums.status.scheduled"),
    in_repair: t("enums.status.inRepair"),
    resolved: t("enums.status.resolved"),
  };
}
