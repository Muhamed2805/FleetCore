import type { createClient } from "@/lib/supabase/client";
import type { Database, DocumentCategory } from "@/lib/supabase/types";

type BrowserClient = ReturnType<typeof createClient>;
type VehicleUpdate = Database["public"]["Tables"]["vehicles"]["Update"];
type Translate = (key: string) => string;

export const DOCUMENTS_BUCKET = "vehicle-documents";

export const documentCategories: DocumentCategory[] = [
  "registration",
  "insurance",
  "inspection",
  "other",
];

// Categories whose validity is tracked on the vehicle, and the column that
// holds the date. Reminders and the calendar read these columns.
export const expiryColumnByCategory = {
  registration: "registration_expiry",
  insurance: "insurance_expiry",
  inspection: "inspection_expiry",
} as const;

export type ExpiringCategory = keyof typeof expiryColumnByCategory;

export const expiringCategories = Object.keys(
  expiryColumnByCategory
) as ExpiringCategory[];

export type VehicleExpiries = Record<
  (typeof expiryColumnByCategory)[ExpiringCategory],
  string | null
>;

// What the upload dialog needs to know about a vehicle: enough to label it,
// match a scanned plate, and prefill the current expiry.
export type DocumentVehicle = VehicleExpiries & {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};

export function vehicleLabel(vehicle: {
  make: string;
  model: string;
  license_plate: string;
}) {
  return `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`;
}

export function isExpiringCategory(
  category: DocumentCategory
): category is ExpiringCategory {
  return category in expiryColumnByCategory;
}

export function vehicleExpiry(
  vehicle: VehicleExpiries,
  category: DocumentCategory
): string | null {
  return isExpiringCategory(category)
    ? vehicle[expiryColumnByCategory[category]]
    : null;
}

export function expiryUpdate(
  category: ExpiringCategory,
  date: string | null
): VehicleUpdate {
  switch (category) {
    case "registration":
      return { registration_expiry: date };
    case "insurance":
      return { insurance_expiry: date };
    case "inspection":
      return { inspection_expiry: date };
  }
}

// `t` is the "vehicles" namespace, which owns the category labels.
export function getDocumentCategoryLabels(
  t: Translate
): Record<DocumentCategory, string> {
  return {
    registration: t("documents.category.registration"),
    insurance: t("documents.category.insurance"),
    inspection: t("documents.category.inspection"),
    other: t("documents.category.other"),
  };
}

// Plates are written with and without spaces and dashes ("SA-123-AB",
// "sa 123 ab"); compare them on letters and digits only.
export function normalizePlate(plate: string | null | undefined) {
  return (plate ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Storage keys accept only a limited character set, so a name like
// "Registracija Škoda.pdf" would be rejected. The original name is kept in
// vehicle_documents.file_name for display; the key only needs to be unique
// and readable.
export function storageSafeFileName(name: string) {
  const safe = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe.slice(-100) || "document";
}

export async function uploadVehicleDocument(
  supabase: BrowserClient,
  input: {
    companyId: string;
    vehicleId: string;
    category: DocumentCategory;
    file: File;
    uploadedBy: string;
  }
): Promise<{ error?: string }> {
  // Objects are keyed "{company_id}/{vehicle_id}/{file}"; the storage RLS
  // policies check the first segment.
  const path = `${input.companyId}/${input.vehicleId}/${Date.now()}-${storageSafeFileName(input.file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, input.file);
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("vehicle_documents").insert({
    company_id: input.companyId,
    vehicle_id: input.vehicleId,
    category: input.category,
    file_path: path,
    file_name: input.file.name,
    uploaded_by: input.uploadedBy,
  });

  if (insertError) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
    return { error: insertError.message };
  }
  return {};
}

export async function deleteVehicleDocument(
  supabase: BrowserClient,
  document: { id: string; file_path: string }
): Promise<{ error?: string }> {
  // Row first: if that fails, the file stays and nothing is left orphaned.
  const { error } = await supabase
    .from("vehicle_documents")
    .delete()
    .eq("id", document.id);
  if (error) return { error: error.message };

  await supabase.storage.from(DOCUMENTS_BUCKET).remove([document.file_path]);
  return {};
}
