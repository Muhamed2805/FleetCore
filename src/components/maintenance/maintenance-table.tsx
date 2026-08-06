"use client";

import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { MaintenanceFormDialog } from "@/components/maintenance/maintenance-form-dialog";
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
import {
  getMaintenanceStatusLabels,
  getMaintenanceTypeLabels,
  maintenanceStatusBadgeVariant,
} from "@/lib/maintenance";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { formatDate } from "@/lib/vehicles";
import { formatCurrency } from "@/lib/expenses";

type MaintenanceRecord =
  Database["public"]["Tables"]["maintenance_records"]["Row"];
type VehicleOption = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};
type StaffOption = { id: string; full_name: string | null };

export function MaintenanceTable({
  records,
  vehicles,
  staff,
  companyId,
  canManage,
}: {
  records: MaintenanceRecord[];
  vehicles: VehicleOption[];
  staff: StaffOption[];
  companyId: string;
  canManage: boolean;
}) {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");
  const maintenanceTypeLabels = getMaintenanceTypeLabels(t);
  const maintenanceStatusLabels = getMaintenanceStatusLabels(t);
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  const vehicleById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles]
  );
  const staffById = useMemo(
    () => new Map(staff.map((person) => [person.id, person])),
    [staff]
  );

  const filtered = useMemo(() => {
    return records.filter((record) => {
      if (statusFilter !== "all" && record.status !== statusFilter)
        return false;
      if (vehicleFilter !== "all" && record.vehicle_id !== vehicleFilter)
        return false;
      return true;
    });
  }, [records, statusFilter, vehicleFilter]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_records")
      .delete()
      .eq("id", id);
    return { error: error?.message };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("table.heading")}
          </h1>
          <p className="text-muted-foreground">
            {t("table.jobCount", { count: records.length })}
          </p>
        </div>
        {canManage && vehicles.length > 0 ? (
          <MaintenanceFormDialog
            companyId={companyId}
            vehicles={vehicles}
            staff={staff}
            trigger={
              <Button>
                <Plus className="size-4" />
                {t("table.addButton")}
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="sm:w-48">
            <SelectValue>
              {(value: string | null) =>
                value && value !== "all"
                  ? maintenanceStatusLabels[value as keyof typeof maintenanceStatusLabels]
                  : t("table.filters.allStatuses")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("table.filters.allStatuses")}</SelectItem>
            {Object.entries(maintenanceStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={vehicleFilter} onValueChange={(v) => setVehicleFilter(v ?? "all")}>
          <SelectTrigger className="sm:w-56">
            <SelectValue>
              {(value: string | null) => {
                const vehicle = value ? vehicleById.get(value) : null;
                return vehicle
                  ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
                  : t("table.filters.allVehicles");
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("table.filters.allVehicles")}</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.make} {vehicle.model} ({vehicle.license_plate})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Wrench className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">
                {records.length === 0
                  ? t("table.emptyState.noJobsTitle")
                  : t("table.emptyState.noMatchTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {records.length === 0
                  ? vehicles.length === 0
                    ? t("table.emptyState.addVehicleFirst")
                    : t("table.emptyState.scheduleOrLog")
                  : t("table.emptyState.tryDifferentFilter")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.columns.job")}</TableHead>
                <TableHead>{t("table.columns.vehicle")}</TableHead>
                <TableHead>{t("table.columns.status")}</TableHead>
                <TableHead>{t("table.columns.scheduled")}</TableHead>
                <TableHead>{t("table.columns.completed")}</TableHead>
                <TableHead>{t("table.columns.cost")}</TableHead>
                <TableHead>{t("table.columns.performedBy")}</TableHead>
                {canManage ? <TableHead className="w-20" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((record) => {
                const vehicle = vehicleById.get(record.vehicle_id);
                const performer = record.performed_by
                  ? staffById.get(record.performed_by)
                  : null;

                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{record.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {maintenanceTypeLabels[record.type]}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {vehicle
                        ? `${vehicle.make} ${vehicle.model}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={maintenanceStatusBadgeVariant[record.status]}>
                        {maintenanceStatusLabels[record.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(record.scheduled_date)}</TableCell>
                    <TableCell>{formatDate(record.completed_date)}</TableCell>
                    <TableCell>
                      {record.cost != null ? formatCurrency(record.cost) : "—"}
                    </TableCell>
                    <TableCell>{performer?.full_name ?? "—"}</TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MaintenanceFormDialog
                            companyId={companyId}
                            vehicles={vehicles}
                            staff={staff}
                            record={record}
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
                            title={t("table.deleteDialog.title", {
                              title: record.title,
                            })}
                            description={t("table.deleteDialog.description")}
                            onConfirm={() => handleDelete(record.id)}
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
