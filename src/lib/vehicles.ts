import type { VehicleStatus, VehicleType } from "@/lib/supabase/types";

type Translate = (key: string) => string;

export function getVehicleTypeLabels(t: Translate): Record<VehicleType, string> {
  return {
    car: t("enums.vehicleType.car"),
    van: t("enums.vehicleType.van"),
    truck: t("enums.vehicleType.truck"),
    construction_machinery: t("enums.vehicleType.constructionMachinery"),
    forklift: t("enums.vehicleType.forklift"),
  };
}

export function getVehicleStatusLabels(t: Translate): Record<VehicleStatus, string> {
  return {
    active: t("enums.vehicleStatus.active"),
    maintenance: t("enums.vehicleStatus.maintenance"),
    inactive: t("enums.vehicleStatus.inactive"),
    sold: t("enums.vehicleStatus.sold"),
  };
}

export const vehicleStatusBadgeVariant: Record<
  VehicleStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  active: "default",
  maintenance: "secondary",
  inactive: "outline",
  sold: "outline",
};

export type ExpiryUrgency = "expired" | "soon" | "ok" | "none";

export function expiryUrgency(date: string | null): ExpiryUrgency {
  if (!date) return "none";
  const days = Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return "expired";
  if (days <= 30) return "soon";
  return "ok";
}

export function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
