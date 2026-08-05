"use client";

import Link from "next/link";
import { Pencil, Plus, Search, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { ExpiryBadge } from "@/components/vehicles/expiry-badge";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import { VehicleFormDialog } from "@/components/vehicles/vehicle-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import type { Database } from "@/lib/supabase/types";
import {
  vehicleStatusBadgeVariant,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from "@/lib/vehicles";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Driver = { id: string; full_name: string | null };

export function VehiclesTable({
  vehicles,
  drivers,
  companyId,
  canManage,
}: {
  vehicles: Vehicle[];
  drivers: Driver[];
  companyId: string;
  canManage: boolean;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const driversById = useMemo(
    () => new Map(drivers.map((driver) => [driver.id, driver])),
    [drivers]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (typeFilter !== "all" && vehicle.type !== typeFilter) return false;
      if (statusFilter !== "all" && vehicle.status !== statusFilter)
        return false;
      if (!query) return true;
      return [vehicle.make, vehicle.model, vehicle.license_plate, vehicle.vin]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));
    });
  }, [vehicles, search, typeFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} in
            your fleet.
          </p>
        </div>
        {canManage ? (
          <VehicleFormDialog
            companyId={companyId}
            drivers={drivers}
            trigger={
              <Button>
                <Plus className="size-4" />
                Add vehicle
              </Button>
            }
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search make, model, plate or VIN…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value ?? "all")}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue>
              {(value: string | null) =>
                value && value !== "all" ? vehicleTypeLabels[value as keyof typeof vehicleTypeLabels] : "All types"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(vehicleTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value ?? "all")}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue>
              {(value: string | null) =>
                value && value !== "all" ? vehicleStatusLabels[value as keyof typeof vehicleStatusLabels] : "All statuses"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(vehicleStatusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Truck className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">
                {vehicles.length === 0
                  ? "No vehicles yet"
                  : "No vehicles match your filters"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {vehicles.length === 0
                  ? "Add your first car, van, truck, machine or forklift."
                  : "Try a different search or filter."}
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
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Inspection</TableHead>
                {canManage ? <TableHead className="w-10" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/vehicles/${vehicle.id}`}
                      className="flex flex-col hover:underline"
                    >
                      <span className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {vehicle.license_plate}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{vehicleTypeLabels[vehicle.type]}</TableCell>
                  <TableCell>
                    <Badge variant={vehicleStatusBadgeVariant[vehicle.status]}>
                      {vehicleStatusLabels[vehicle.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vehicle.assigned_driver_id
                      ? (driversById.get(vehicle.assigned_driver_id)
                          ?.full_name ?? "—")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge date={vehicle.registration_expiry} />
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge date={vehicle.insurance_expiry} />
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge date={vehicle.inspection_expiry} />
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <VehicleFormDialog
                          companyId={companyId}
                          drivers={drivers}
                          vehicle={vehicle}
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <Pencil className="size-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          }
                        />
                        <DeleteVehicleDialog
                          vehicleId={vehicle.id}
                          vehicleLabel={`${vehicle.make} ${vehicle.model}`}
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
