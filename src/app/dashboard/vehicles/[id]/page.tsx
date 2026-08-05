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
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import {
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

  const [{ data: vehicle }, { data: documents }, { data: drivers }] =
    await Promise.all([
      supabase.from("vehicles").select("*").eq("id", id).single(),
      supabase
        .from("vehicle_documents")
        .select("*")
        .eq("vehicle_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").eq("role", "driver"),
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

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
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
    </div>
  );
}
