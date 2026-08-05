import type { MaintenanceStatus, MaintenanceType } from "@/lib/supabase/types";

export const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  oil_change: "Oil change",
  tire_rotation: "Tire rotation",
  brake_service: "Brake service",
  inspection: "Inspection",
  repair: "Repair",
  other: "Other",
};

export const maintenanceStatusLabels: Record<MaintenanceStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const maintenanceStatusBadgeVariant: Record<
  MaintenanceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  scheduled: "secondary",
  in_progress: "default",
  completed: "outline",
  cancelled: "destructive",
};
