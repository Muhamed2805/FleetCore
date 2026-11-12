"use client";

import { Droplets, Fuel, Gauge, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { StatCard } from "@/components/dashboard/stat-card";
import {
  FuelEntryFormDialog,
  type FuelVehicleOption,
} from "@/components/fuel/fuel-entry-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/expenses";
import {
  computeConsumption,
  formatConsumption,
  formatKm,
  formatLiters,
  pricePerLiter,
  type FuelEntry,
} from "@/lib/fuel";
import { createClient } from "@/lib/supabase/client";
import { formatDate, vehicleLabel } from "@/lib/vehicles";

export function FuelLogTable({
  entries,
  vehicles,
  loggableVehicleIds,
  companyId,
  profileId,
  canManage,
  initialVehicleId,
}: {
  entries: FuelEntry[];
  vehicles: FuelVehicleOption[];
  // Vehicles this user may log fuel for: all of them for managers, the
  // assigned ones for drivers.
  loggableVehicleIds: string[];
  companyId: string;
  profileId: string;
  canManage: boolean;
  initialVehicleId?: string;
}) {
  const t = useTranslations("fuel");
  const tCommon = useTranslations("common");
  const [vehicleFilter, setVehicleFilter] = useState(
    initialVehicleId && vehicles.some((v) => v.id === initialVehicleId)
      ? initialVehicleId
      : "all"
  );

  const vehicleById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles]
  );
  const loggableVehicles = useMemo(
    () => vehicles.filter((vehicle) => loggableVehicleIds.includes(vehicle.id)),
    [vehicles, loggableVehicleIds]
  );

  const filtered = useMemo(
    () =>
      vehicleFilter === "all"
        ? entries
        : entries.filter((entry) => entry.vehicle_id === vehicleFilter),
    [entries, vehicleFilter]
  );

  const stats = useMemo(() => {
    const consumption = computeConsumption(filtered);
    const liters = filtered.reduce((sum, entry) => sum + entry.liters, 0);
    const cost = filtered.reduce((sum, entry) => sum + entry.total_cost, 0);
    return {
      consumption,
      liters,
      cost,
      averagePrice: liters > 0 ? cost / liters : null,
    };
  }, [filtered]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("fuel_entries").delete().eq("id", id);
    return { error: error?.message };
  }

  const defaultVehicleId =
    vehicleFilter !== "all" && loggableVehicleIds.includes(vehicleFilter)
      ? vehicleFilter
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("table.heading")}
          </h1>
          <p className="text-muted-foreground">
            {t("table.summary", {
              count: filtered.length,
              liters: formatLiters(stats.liters),
              total: formatCurrency(stats.cost),
            })}
          </p>
        </div>
        {loggableVehicles.length > 0 ? (
          <FuelEntryFormDialog
            companyId={companyId}
            createdBy={profileId}
            vehicles={loggableVehicles}
            defaultVehicleId={defaultVehicleId}
            trigger={
              <Button>
                <Plus className="size-4" />
                {t("table.addButton")}
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title={t("stats.averageConsumption")}
          value={
            stats.consumption.average != null
              ? formatConsumption(stats.consumption.average)
              : "—"
          }
          hint={
            stats.consumption.average != null
              ? t("stats.measuredOver", {
                  distance: formatKm(stats.consumption.distance),
                })
              : t("stats.needsTwoFullTanks")
          }
          icon={Gauge}
          tone="indigo"
        />
        <StatCard
          title={t("stats.averagePrice")}
          value={
            stats.averagePrice != null ? formatCurrency(stats.averagePrice) : "—"
          }
          hint={t("stats.perLiter")}
          icon={Fuel}
          tone="amber"
        />
        <StatCard
          title={t("stats.totalLiters")}
          value={formatLiters(stats.liters)}
          hint={t("stats.totalCost", { total: formatCurrency(stats.cost) })}
          icon={Droplets}
          tone="emerald"
        />
      </div>

      <Select
        value={vehicleFilter}
        onValueChange={(value) => setVehicleFilter(value ?? "all")}
      >
        <SelectTrigger className="sm:w-72">
          <SelectValue>
            {(value: string | null) => {
              const vehicle =
                value && value !== "all" ? vehicleById.get(value) : null;
              return vehicle
                ? vehicleLabel(vehicle)
                : t("table.filters.allVehicles");
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("table.filters.allVehicles")}</SelectItem>
          {vehicles.map((vehicle) => (
            <SelectItem key={vehicle.id} value={vehicle.id}>
              {vehicleLabel(vehicle)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Fuel className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">
                {entries.length === 0
                  ? t("table.emptyState.noEntriesTitle")
                  : t("table.emptyState.noMatchTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {entries.length === 0
                  ? t("table.emptyState.logFillUps")
                  : t("table.emptyState.tryDifferentVehicle")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs dark:shadow-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.date")}</TableHead>
                <TableHead>{t("table.columns.vehicle")}</TableHead>
                <TableHead className="text-right">
                  {t("table.columns.odometer")}
                </TableHead>
                <TableHead className="text-right">
                  {t("table.columns.liters")}
                </TableHead>
                <TableHead className="text-right">
                  {t("table.columns.pricePerLiter")}
                </TableHead>
                <TableHead className="text-right">
                  {t("table.columns.total")}
                </TableHead>
                <TableHead className="text-right">
                  {t("table.columns.consumption")}
                </TableHead>
                {canManage ? <TableHead className="w-20" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => {
                const vehicle = vehicleById.get(entry.vehicle_id);
                const consumption = stats.consumption.byEntry.get(entry.id);
                const unitPrice = pricePerLiter(entry);

                return (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.filled_on)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}
                        </span>
                        {entry.station ? (
                          <span className="max-w-48 truncate text-xs text-muted-foreground">
                            {entry.station}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatKm(entry.odometer)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        {!entry.full_tank ? (
                          <Badge variant="outline">
                            {t("table.partial")}
                          </Badge>
                        ) : null}
                        {formatLiters(entry.liters)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {unitPrice != null ? formatCurrency(unitPrice) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(entry.total_cost)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {consumption != null ? formatConsumption(consumption) : "—"}
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FuelEntryFormDialog
                            companyId={companyId}
                            createdBy={profileId}
                            vehicles={vehicles}
                            entry={entry}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Pencil className="size-4" />
                                <span className="sr-only">
                                  {tCommon("actions.edit")}
                                </span>
                              </Button>
                            }
                          />
                          <ConfirmDeleteDialog
                            title={t("table.deleteDialog.title")}
                            description={t("table.deleteDialog.description")}
                            onConfirm={() => handleDelete(entry.id)}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Trash2 className="size-4" />
                                <span className="sr-only">
                                  {tCommon("actions.delete")}
                                </span>
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
