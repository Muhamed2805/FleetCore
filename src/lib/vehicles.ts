import type { VehicleStatus, VehicleType } from "@/lib/supabase/types";

export const vehicleTypeLabels: Record<VehicleType, string> = {
  car: "Car",
  van: "Van",
  truck: "Truck",
  construction_machinery: "Construction machinery",
  forklift: "Forklift",
};

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  active: "Active",
  maintenance: "In maintenance",
  inactive: "Inactive",
  sold: "Sold",
};

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
