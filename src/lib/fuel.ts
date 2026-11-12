import type { Tables } from "@/lib/supabase/types";

export type FuelEntry = Tables<"fuel_entries">;

type ConsumptionInput = Pick<
  FuelEntry,
  "id" | "vehicle_id" | "odometer" | "liters" | "full_tank" | "filled_on" | "created_at"
>;

export type FuelConsumption = {
  // l/100 km of each full-tank fill-up that closes a measured stretch.
  byEntry: Map<string, number>;
  // Over every measured stretch together; null until there is one.
  average: number | null;
  // Liters and km of the measured stretches only.
  liters: number;
  distance: number;
};

// Full-tank method: the fuel bought between two full tanks, divided by the
// km driven between them. Partial fill-ups count towards the next full one.
// Fill-ups before a vehicle's first full tank can't be measured, since the
// starting level is unknown. Entries are taken in odometer order, so a
// fill-up logged late still lands in the right place.
export function computeConsumption(entries: ConsumptionInput[]): FuelConsumption {
  const byVehicle = new Map<string, ConsumptionInput[]>();
  for (const entry of entries) {
    const list = byVehicle.get(entry.vehicle_id) ?? [];
    list.push(entry);
    byVehicle.set(entry.vehicle_id, list);
  }

  const byEntry = new Map<string, number>();
  let liters = 0;
  let distance = 0;

  for (const list of byVehicle.values()) {
    list.sort(
      (a, b) =>
        a.odometer - b.odometer ||
        a.filled_on.localeCompare(b.filled_on) ||
        a.created_at.localeCompare(b.created_at)
    );

    let lastFullOdometer: number | null = null;
    let litersSince = 0;
    for (const entry of list) {
      if (lastFullOdometer === null) {
        if (entry.full_tank) lastFullOdometer = entry.odometer;
        continue;
      }
      litersSince += Number(entry.liters);
      if (!entry.full_tank) continue;

      const driven = entry.odometer - lastFullOdometer;
      if (driven > 0) {
        byEntry.set(entry.id, (litersSince / driven) * 100);
        liters += litersSince;
        distance += driven;
      }
      lastFullOdometer = entry.odometer;
      litersSince = 0;
    }
  }

  return {
    byEntry,
    average: distance > 0 ? (liters / distance) * 100 : null,
    liters,
    distance,
  };
}

export function pricePerLiter(entry: Pick<FuelEntry, "liters" | "total_cost">) {
  return entry.liters > 0 ? entry.total_cost / entry.liters : null;
}

const numberFormat = (fractionDigits: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

export function formatLiters(value: number) {
  return `${numberFormat(2).format(value)} L`;
}

export function formatConsumption(value: number) {
  return `${numberFormat(1).format(value)} L/100 km`;
}

export function formatKm(value: number) {
  return `${numberFormat(0).format(value)} km`;
}

export type OdometerReading = {
  id: string;
  source: "fuel" | "maintenance";
  date: string;
  odometer: number;
};

// Odometer readings a vehicle has on record, newest first: fill-ups and
// completed maintenance with a reading.
export function getOdometerReadings(
  fuelEntries: Pick<FuelEntry, "id" | "filled_on" | "odometer">[],
  maintenanceRecords: {
    id: string;
    status: string;
    completed_date: string | null;
    odometer: number | null;
  }[]
): OdometerReading[] {
  const readings: OdometerReading[] = [
    ...fuelEntries.map((entry) => ({
      id: entry.id,
      source: "fuel" as const,
      date: entry.filled_on,
      odometer: entry.odometer,
    })),
    ...maintenanceRecords.flatMap((record) =>
      record.status === "completed" &&
      record.completed_date &&
      record.odometer != null
        ? [
            {
              id: record.id,
              source: "maintenance" as const,
              date: record.completed_date,
              odometer: record.odometer,
            },
          ]
        : []
    ),
  ];

  return readings.sort(
    (a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer
  );
}
