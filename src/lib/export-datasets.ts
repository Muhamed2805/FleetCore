import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { buildCsv, type CsvColumn } from "@/lib/csv";
import {
  CURRENCY,
  filterExpenses,
  getExpenseCategoryLabels,
} from "@/lib/expenses";
import type { ExportDataset } from "@/lib/export";
import {
  filterMaintenanceRecords,
  getMaintenanceStatusLabels,
  getMaintenanceTypeLabels,
} from "@/lib/maintenance";
import type { createClient } from "@/lib/supabase/server";
import { Constants, type Tables } from "@/lib/supabase/types";
import {
  filterVehicles,
  getVehicleStatusLabels,
  getVehicleTypeLabels,
} from "@/lib/vehicles";

// Server side of the CSV export (route: /dashboard/export/[dataset]). Reads
// run as the signed-in user, so RLS limits every export to their company,
// exactly like the pages. Filters arrive in the query string under the same
// names the tables use, and go through the same filter functions.

type Supabase = Awaited<ReturnType<typeof createClient>>;

type ExportInput = {
  supabase: Supabase;
  locale: string;
  params: URLSearchParams;
};

// PostgREST caps each response at `max_rows` (1000 by default, possibly
// lower on a hosted project), so rows are read in pages until the total
// count is reached.
const PAGE_SIZE = 1000;

async function fetchAll<Row>(
  page: (
    from: number,
    to: number
  ) => PromiseLike<{ data: Row[] | null; error: unknown; count: number | null }>
) {
  const rows: Row[] = [];
  for (;;) {
    const { data, error, count } = await page(
      rows.length,
      rows.length + PAGE_SIZE - 1
    );
    if (error) throw error;
    if (!data?.length) return rows;
    rows.push(...data);
    if (count !== null && rows.length >= count) return rows;
  }
}

function fetchNames(supabase: Supabase) {
  return fetchAll((from, to) =>
    supabase
      .from("profiles")
      .select("id, full_name", { count: "exact" })
      .order("id")
      .range(from, to)
  ).then((profiles) => new Map(profiles.map((p) => [p.id, p.full_name])));
}

function fetchVehicleNames(supabase: Supabase) {
  return fetchAll((from, to) =>
    supabase
      .from("vehicles")
      .select("id, make, model, license_plate", { count: "exact" })
      .order("id")
      .range(from, to)
  ).then((vehicles) => new Map(vehicles.map((v) => [v.id, v])));
}

const optionalText = z.string().trim().max(200).optional();

const filterSchemas = {
  vehicles: z.object({
    search: optionalText,
    type: z.enum(Constants.public.Enums.vehicle_type).optional(),
    status: z.enum(Constants.public.Enums.vehicle_status).optional(),
  }),
  maintenance: z.object({
    status: z.enum(Constants.public.Enums.maintenance_status).optional(),
    vehicleId: z.uuid().optional(),
  }),
  expenses: z.object({
    category: z.enum(Constants.public.Enums.expense_category).optional(),
  }),
};

async function exportVehicles(
  { supabase, locale }: ExportInput,
  filters: z.infer<typeof filterSchemas.vehicles>
) {
  const [t, tVehicles] = await Promise.all([
    getTranslations({ locale, namespace: "export" }),
    getTranslations({ locale, namespace: "vehicles" }),
  ]);
  const [vehicles, names] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("vehicles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    fetchNames(supabase),
  ]);
  const typeLabels = getVehicleTypeLabels(tVehicles);
  const statusLabels = getVehicleStatusLabels(tVehicles);

  const columns: CsvColumn<Tables<"vehicles">>[] = [
    { header: t("columns.make"), value: (v) => v.make },
    { header: t("columns.model"), value: (v) => v.model },
    { header: t("columns.year"), value: (v) => v.year },
    { header: t("columns.licensePlate"), value: (v) => v.license_plate },
    { header: t("columns.vin"), value: (v) => v.vin },
    { header: t("columns.type"), value: (v) => typeLabels[v.type] },
    { header: t("columns.status"), value: (v) => statusLabels[v.status] },
    { header: t("columns.odometer"), value: (v) => v.odometer },
    {
      header: t("columns.assignedDriver"),
      value: (v) =>
        v.assigned_driver_id ? (names.get(v.assigned_driver_id) ?? null) : null,
    },
    {
      header: t("columns.registrationExpiry"),
      value: (v) => v.registration_expiry,
    },
    { header: t("columns.insuranceExpiry"), value: (v) => v.insurance_expiry },
    {
      header: t("columns.inspectionExpiry"),
      value: (v) => v.inspection_expiry,
    },
    { header: t("columns.notes"), value: (v) => v.notes },
  ];

  return buildCsv(columns, filterVehicles(vehicles, filters), locale);
}

async function exportMaintenance(
  { supabase, locale }: ExportInput,
  filters: z.infer<typeof filterSchemas.maintenance>
) {
  const [t, tMaintenance] = await Promise.all([
    getTranslations({ locale, namespace: "export" }),
    getTranslations({ locale, namespace: "maintenance" }),
  ]);
  const [records, vehicles, names] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("maintenance_records")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    fetchVehicleNames(supabase),
    fetchNames(supabase),
  ]);
  const typeLabels = getMaintenanceTypeLabels(tMaintenance);
  const statusLabels = getMaintenanceStatusLabels(tMaintenance);

  const columns: CsvColumn<Tables<"maintenance_records">>[] = [
    { header: t("columns.title"), value: (r) => r.title },
    {
      header: t("columns.vehicle"),
      value: (r) => {
        const vehicle = vehicles.get(r.vehicle_id);
        return vehicle ? `${vehicle.make} ${vehicle.model}` : null;
      },
    },
    {
      header: t("columns.licensePlate"),
      value: (r) => vehicles.get(r.vehicle_id)?.license_plate ?? null,
    },
    { header: t("columns.type"), value: (r) => typeLabels[r.type] },
    { header: t("columns.status"), value: (r) => statusLabels[r.status] },
    { header: t("columns.scheduledDate"), value: (r) => r.scheduled_date },
    { header: t("columns.completedDate"), value: (r) => r.completed_date },
    {
      header: t("columns.cost", { currency: CURRENCY }),
      value: (r) => r.cost,
      money: true,
    },
    { header: t("columns.odometer"), value: (r) => r.odometer },
    {
      header: t("columns.performedBy"),
      value: (r) =>
        r.performed_by ? (names.get(r.performed_by) ?? null) : null,
    },
    { header: t("columns.description"), value: (r) => r.description },
  ];

  return buildCsv(columns, filterMaintenanceRecords(records, filters), locale);
}

async function exportExpenses(
  { supabase, locale }: ExportInput,
  filters: z.infer<typeof filterSchemas.expenses>
) {
  const [t, tExpenses] = await Promise.all([
    getTranslations({ locale, namespace: "export" }),
    getTranslations({ locale, namespace: "expenses" }),
  ]);
  const [expenses, vehicles] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("expenses")
        .select("*", { count: "exact" })
        .order("expense_date", { ascending: false })
        .order("id")
        .range(from, to)
    ),
    fetchVehicleNames(supabase),
  ]);
  const categoryLabels = getExpenseCategoryLabels(tExpenses);

  const columns: CsvColumn<Tables<"expenses">>[] = [
    { header: t("columns.date"), value: (e) => e.expense_date },
    { header: t("columns.category"), value: (e) => categoryLabels[e.category] },
    {
      header: t("columns.vehicle"),
      value: (e) => {
        const vehicle = e.vehicle_id ? vehicles.get(e.vehicle_id) : null;
        return vehicle ? `${vehicle.make} ${vehicle.model}` : null;
      },
    },
    {
      header: t("columns.licensePlate"),
      value: (e) =>
        e.vehicle_id
          ? (vehicles.get(e.vehicle_id)?.license_plate ?? null)
          : null,
    },
    { header: t("columns.description"), value: (e) => e.description },
    {
      header: t("columns.amount", { currency: CURRENCY }),
      value: (e) => e.amount,
      money: true,
    },
  ];

  return buildCsv(columns, filterExpenses(expenses, filters), locale);
}

// Returns the CSV, or null when the query string has an invalid filter.
export async function buildExport(dataset: ExportDataset, input: ExportInput) {
  const raw = Object.fromEntries(input.params);

  switch (dataset) {
    case "vehicles": {
      const filters = filterSchemas.vehicles.safeParse(raw);
      return filters.success ? exportVehicles(input, filters.data) : null;
    }
    case "maintenance": {
      const filters = filterSchemas.maintenance.safeParse(raw);
      return filters.success ? exportMaintenance(input, filters.data) : null;
    }
    case "expenses": {
      const filters = filterSchemas.expenses.safeParse(raw);
      return filters.success ? exportExpenses(input, filters.data) : null;
    }
  }
}
