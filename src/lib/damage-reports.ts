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
