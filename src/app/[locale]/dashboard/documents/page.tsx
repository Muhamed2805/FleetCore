import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import {
  DocumentsTable,
  type DocumentRow,
  type MissingDocument,
} from "@/components/documents/documents-table";
import { redirect } from "@/i18n/navigation";
import {
  DOCUMENTS_BUCKET,
  expiringCategories,
  isExpiringCategory,
  vehicleExpiry,
  type DocumentVehicle,
} from "@/lib/documents";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const t = await getTranslations("documents");
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
  }

  const supabase = await createClient();

  const [{ data: documents }, { data: vehicles }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("vehicle_documents")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("vehicles")
        .select(
          "id, make, model, license_plate, status, registration_expiry, insurance_expiry, inspection_expiry"
        )
        .order("make"),
      supabase.from("profiles").select("id, full_name"),
    ]);

  const documentPaths = (documents ?? []).map((doc) => doc.file_path);
  const { data: signedUrls } =
    documentPaths.length > 0
      ? await supabase.storage
          .from(DOCUMENTS_BUCKET)
          .createSignedUrls(documentPaths, 3600)
      : { data: [] as { path: string | null; signedUrl: string }[] };

  const urlByPath = new Map(
    (signedUrls ?? []).map((entry) => [entry.path, entry.signedUrl])
  );
  const vehiclesById = new Map((vehicles ?? []).map((v) => [v.id, v]));
  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Documents come newest first, so the first one seen for a vehicle and
  // category is the current one; the vehicle's expiry date belongs to it,
  // and older ones of a tracked category have been replaced.
  const seen = new Set<string>();
  const rows: DocumentRow[] = (documents ?? []).map((doc) => {
    const key = `${doc.vehicle_id}:${doc.category}`;
    const isCurrent = !seen.has(key);
    seen.add(key);
    const vehicle = vehiclesById.get(doc.vehicle_id);

    return {
      id: doc.id,
      file_name: doc.file_name,
      file_path: doc.file_path,
      category: doc.category,
      created_at: doc.created_at,
      vehicle_id: doc.vehicle_id,
      url: urlByPath.get(doc.file_path) ?? null,
      vehicle: vehicle
        ? {
            id: vehicle.id,
            make: vehicle.make,
            model: vehicle.model,
            license_plate: vehicle.license_plate,
          }
        : null,
      uploadedByName: doc.uploaded_by
        ? (profilesById.get(doc.uploaded_by)?.full_name ??
          t("table.unnamedUploader"))
        : null,
      expiry: isCurrent && vehicle ? vehicleExpiry(vehicle, doc.category) : null,
      isReplaced: !isCurrent && isExpiringCategory(doc.category),
    };
  });

  // Vehicles still in the fleet, which documents can be uploaded for.
  const activeVehicles: DocumentVehicle[] = (vehicles ?? [])
    .filter((vehicle) => vehicle.status !== "sold")
    .map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      license_plate: vehicle.license_plate,
      registration_expiry: vehicle.registration_expiry,
      insurance_expiry: vehicle.insurance_expiry,
      inspection_expiry: vehicle.inspection_expiry,
    }));

  // An expiry date on file with no document to back it. A vehicle with no
  // date for a category (say, a forklift without registration) isn't
  // missing anything.
  const missing: MissingDocument[] = activeVehicles
    .flatMap((vehicle) =>
      expiringCategories
        .filter(
          (category) =>
            vehicleExpiry(vehicle, category) &&
            !seen.has(`${vehicle.id}:${category}`)
        )
        .map((category) => ({
          vehicle,
          category,
          expiry: vehicleExpiry(vehicle, category),
        }))
    )
    .sort((a, b) => (a.expiry ?? "").localeCompare(b.expiry ?? ""));

  const canManage =
    profile.role === "admin" || profile.role === "fleet_manager";

  return (
    <DocumentsTable
      documents={rows}
      missing={canManage ? missing : []}
      vehicles={(vehicles ?? []).map((vehicle) => ({
        id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        license_plate: vehicle.license_plate,
      }))}
      uploadVehicles={activeVehicles}
      companyId={profile.company_id}
      uploadedBy={profile.id}
      canManage={canManage}
    />
  );
}
