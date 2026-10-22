import type { MaintenanceStatus, MaintenanceType } from "@/lib/supabase/types";

type Translate = (key: string) => string;

export function getMaintenanceTypeLabels(
  t: Translate
): Record<MaintenanceType, string> {
  return {
    oil_change: t("enums.maintenanceType.oilChange"),
    tire_rotation: t("enums.maintenanceType.tireRotation"),
    brake_service: t("enums.maintenanceType.brakeService"),
    inspection: t("enums.maintenanceType.inspection"),
    repair: t("enums.maintenanceType.repair"),
    other: t("enums.maintenanceType.other"),
  };
}

export function getMaintenanceStatusLabels(
  t: Translate
): Record<MaintenanceStatus, string> {
  return {
    scheduled: t("enums.maintenanceStatus.scheduled"),
    in_progress: t("enums.maintenanceStatus.inProgress"),
    completed: t("enums.maintenanceStatus.completed"),
    cancelled: t("enums.maintenanceStatus.cancelled"),
  };
}

export const maintenanceStatusBadgeVariant: Record<
  MaintenanceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  scheduled: "secondary",
  in_progress: "default",
  completed: "outline",
  cancelled: "destructive",
};

// "all" (or nothing) means no filter. Used by the Maintenance table and the
// CSV export, so both filter the same way.
export type MaintenanceFilters = { status?: string; vehicleId?: string };

export function filterMaintenanceRecords<
  R extends { status: MaintenanceStatus; vehicle_id: string },
>(records: R[], { status = "all", vehicleId = "all" }: MaintenanceFilters) {
  return records.filter(
    (record) =>
      (status === "all" || record.status === status) &&
      (vehicleId === "all" || record.vehicle_id === vehicleId)
  );
}
