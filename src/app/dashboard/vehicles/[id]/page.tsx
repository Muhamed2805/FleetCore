import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteVehicleDialog } from "@/components/vehicles/delete-vehicle-dialog";
import { ExpiryBadge } from "@/components/vehicles/expiry-badge";
import { VehicleDocuments } from "@/components/vehicles/vehicle-documents";
import { VehicleFormDialog } from "@/components/vehicles/vehicle-form-dialog";
import { formatCurrency } from "@/lib/expenses";
import {
  maintenanceStatusBadgeVariant,
  maintenanceStatusLabels,
} from "@/lib/maintenance";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import {
  formatDate,
  vehicleStatusBadgeVariant,
  vehicleStatusLabels,
  vehicleTypeLabels,
} from "@/lib/vehicles";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();

  const [{ data: vehicle }, { data: documents }, { data: drivers }, { data: maintenanceRecords }] =
    await Promise.all([
      supabase.from("vehicles").select("*").eq("id", id).single(),
      supabase
        .from("vehicle_documents")
        .select("*")
        .eq("vehicle_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("role", "driver"),
      supabase
        .from("maintenance_records")
        .select("*")
        .eq("vehicle_id", id)
        .order("created_at", { ascending: false }),
    ]);

  if (!vehicle) {
    notFound();
  }

  const documentPaths = (documents ?? []).map((doc) => doc.file_path);
  const { data: signedUrls } =
    documentPaths.length > 0
      ? await supabase.storage
          .from("vehicle-documents")
          .createSignedUrls(documentPaths, 3600)
      : { data: [] as { path: string | null; signedUrl: string }[] };

  const urlByPath = new Map(
    (signedUrls ?? []).map((entry) => [entry.path, entry.signedUrl])
  );
  const documentsWithUrl = (documents ?? []).map((doc) => ({
    ...doc,
    url: urlByPath.get(doc.file_path) ?? null,
  }));

  const canManage = profile.role === "admin" || profile.role === "fleet_manager";
  const driver = vehicle.assigned_driver_id
    ? (drivers ?? []).find((d) => d.id === vehicle.assigned_driver_id)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2"
          nativeButton={false}
          render={<Link href="/dashboard/vehicles" />}
        >
          <ArrowLeft className="size-4" />
          Vehicles
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight break-words">
              {vehicle.make} {vehicle.model}
            </h1>
            <Badge variant={vehicleStatusBadgeVariant[vehicle.status]}>
              {vehicleStatusLabels[vehicle.status]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {vehicle.license_plate} · {vehicleTypeLabels[vehicle.type]}
          </p>
        </div>
        {canManage ? (
          <div className="flex items-center gap-2">
            <VehicleFormDialog
              companyId={profile.company_id}
              drivers={drivers ?? []}
              vehicle={vehicle}
              trigger={
                <Button variant="outline">
                  <Pencil className="size-4" />
                  Edit
                </Button>
              }
            />
            <DeleteVehicleDialog
              vehicleId={vehicle.id}
              vehicleLabel={`${vehicle.make} ${vehicle.model}`}
              trigger={<Button variant="outline">Delete</Button>}
            />
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Year</span>
            <span>{vehicle.year ?? "—"}</span>
            <span className="text-muted-foreground">VIN</span>
            <span>{vehicle.vin ?? "—"}</span>
            <span className="text-muted-foreground">Odometer</span>
            <span>{vehicle.odometer ? `${vehicle.odometer} km` : "—"}</span>
            <span className="text-muted-foreground">Assigned driver</span>
            <span>{driver?.full_name ?? "Unassigned"}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Expiration dates
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-3 text-sm">
            <span className="text-muted-foreground">Registration</span>
            <ExpiryBadge date={vehicle.registration_expiry} />
            <span className="text-muted-foreground">Insurance</span>
            <ExpiryBadge date={vehicle.insurance_expiry} />
            <span className="text-muted-foreground">Inspection</span>
            <ExpiryBadge date={vehicle.inspection_expiry} />
          </CardContent>
        </Card>
      </div>

      {vehicle.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">
            {vehicle.notes}
          </CardContent>
        </Card>
      ) : null}

      <VehicleDocuments
        vehicleId={vehicle.id}
        companyId={profile.company_id}
        uploadedBy={profile.id}
        documents={documentsWithUrl}
        canManage={canManage}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm text-muted-foreground">
            Maintenance history
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/maintenance" />}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent>
          {!maintenanceRecords?.length ? (
            <p className="text-sm text-muted-foreground">
              No maintenance recorded yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y">
              {maintenanceRecords.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{record.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(record.completed_date ?? record.scheduled_date)}
                      {record.cost != null
                        ? ` · ${formatCurrency(record.cost)}`
                        : ""}
                    </span>
                  </div>
                  <Badge variant={maintenanceStatusBadgeVariant[record.status]}>
                    {maintenanceStatusLabels[record.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
