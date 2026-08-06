"use client";

import { Eye, Plus, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { DamageReportDetailDialog } from "@/components/damage-reports/damage-report-detail-dialog";
import type { DamageReportWithDetails } from "@/components/damage-reports/damage-report-detail-dialog";
import { DamageReportFormDialog } from "@/components/damage-reports/damage-report-form-dialog";
import {
  damageSeverityBadgeVariant,
  damageSeverityLabels,
  damageStatusBadgeVariant,
  damageStatusLabels,
} from "@/lib/damage-reports";
import { formatCurrency } from "@/lib/expenses";
import { formatDate } from "@/lib/vehicles";

type VehicleOption = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};

export function DamageReportsTable({
  reports,
  vehicles,
  companyId,
  reportedBy,
  canManage,
}: {
  reports: DamageReportWithDetails[];
  vehicles: VehicleOption[];
  companyId: string;
  reportedBy: string;
  canManage: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  const filtered = useMemo(() => {
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter)
        return false;
      if (vehicleFilter !== "all" && report.vehicle_id !== vehicleFilter)
        return false;
      return true;
    });
  }, [reports, statusFilter, vehicleFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Damage reports
          </h1>
          <p className="text-muted-foreground">
            {reports.length} report{reports.length === 1 ? "" : "s"}.
          </p>
        </div>
        {vehicles.length > 0 ? (
          <DamageReportFormDialog
            companyId={companyId}
            vehicles={vehicles}
            reportedBy={reportedBy}
            trigger={
              <Button>
                <Plus className="size-4" />
                Report damage
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
                  ? damageStatusLabels[value as keyof typeof damageStatusLabels]
                  : "All statuses"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(damageStatusLabels).map(([value, label]) => (
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
                const vehicle = value
                  ? vehicles.find((v) => v.id === value)
                  : null;
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
              <TriangleAlert className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">
                {reports.length === 0
                  ? "No damage reported"
                  : "No reports match your filters"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {reports.length === 0
                  ? vehicles.length === 0
                    ? "Add a vehicle first, then report damage against it."
                    : "Report damage with a photo when it happens."
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
                <TableHead>Vehicle</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Reported by</TableHead>
                <TableHead>Repair cost</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    {report.vehicle
                      ? `${report.vehicle.make} ${report.vehicle.model}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={damageSeverityBadgeVariant[report.severity]}>
                      {damageSeverityLabels[report.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={damageStatusBadgeVariant[report.status]}>
                      {damageStatusLabels[report.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(report.reported_at)}</TableCell>
                  <TableCell>{report.reportedByName ?? "—"}</TableCell>
                  <TableCell>
                    {report.expense ? formatCurrency(report.expense.amount) : "—"}
                  </TableCell>
                  <TableCell>
                    <DamageReportDetailDialog
                      report={report}
                      companyId={companyId}
                      vehicles={vehicles}
                      canManage={canManage}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Eye className="size-4" />
                          <span className="sr-only">View</span>
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
