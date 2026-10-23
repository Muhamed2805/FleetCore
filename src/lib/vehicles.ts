import type { BadgeVariant } from "@/components/ui/badge";
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

export const vehicleStatusBadgeVariant: Record<VehicleStatus, BadgeVariant> =
  {
    active: "success",
    maintenance: "warning",
    inactive: "outline",
    sold: "secondary",
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

// "Make Model (PLATE)", how a vehicle is named in lists and pickers.
export function vehicleLabel(vehicle: {
  make: string;
  model: string;
  license_plate: string;
}) {
  return `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;
}

// "all" (or nothing) means no filter. Used by the Vehicles table and the
// CSV export, so both filter the same way.
export type VehicleFilters = {
  search?: string;
  type?: string;
  status?: string;
};

export function filterVehicles<
  V extends {
    type: VehicleType;
    status: VehicleStatus;
    make: string;
    model: string;
    license_plate: string;
    vin: string | null;
  },
>(
  vehicles: V[],
  { search = "", type = "all", status = "all" }: VehicleFilters
) {
  const query = search.trim().toLowerCase();
  return vehicles.filter((vehicle) => {
    if (type !== "all" && vehicle.type !== type) return false;
    if (status !== "all" && vehicle.status !== status) return false;
    if (!query) return true;
    return [
      vehicle.make,
      vehicle.model,
      vehicle.license_plate,
      vehicle.vin,
    ].some((field) => field?.toLowerCase().includes(query));
  });
}
