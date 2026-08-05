"use client";

import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
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
  maintenanceStatusBadgeVariant,
  maintenanceStatusLabels,
  maintenanceTypeLabels,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Maintenance
          </h1>
          <p className="text-muted-foreground">
            {records.length} maintenance job{records.length === 1 ? "" : "s"}.
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
                Add maintenance
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
                  : "All statuses"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
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
                  : "All vehicles";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All vehicles</SelectItem>
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
                  ? "No maintenance jobs yet"
                  : "No jobs match your filters"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {records.length === 0
                  ? vehicles.length === 0
                    ? "Add a vehicle first, then schedule maintenance for it."
                    : "Schedule maintenance or log completed work."
                  : "Try a different filter."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Performed by</TableHead>
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
                                <span className="sr-only">Edit</span>
                              </Button>
                            }
                          />
                          <ConfirmDeleteDialog
                            title={`Delete ${record.title}?`}
                            description="This can't be undone."
                            onConfirm={() => handleDelete(record.id)}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete</span>
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
