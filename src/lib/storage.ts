import type { createClient } from "@/lib/supabase/client";

export type BrowserClient = ReturnType<typeof createClient>;

// Private buckets; files are served through signed URLs. Keys start with
// the company id, which the storage RLS policies check.
export const DOCUMENTS_BUCKET = "vehicle-documents";
export const DAMAGE_PHOTOS_BUCKET = "damage-reports";

// Storage keys accept only a limited character set, so a name like
// "Registracija Škoda.pdf" would be rejected. Keep the original name in the
// database for display; the key only needs to be unique and readable.
export function storageSafeFileName(name: string) {
  const safe = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe.slice(-100) || "file";
}

async function removeFiles(
  supabase: BrowserClient,
  bucket: string,
  paths: string[]
) {
  if (paths.length > 0) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

// Deleting a vehicle or a damage report cascades to its document and photo
// rows in the database, but not to their files in Storage, which would be
// kept (and billed) forever. These collect the paths, delete the row, then
// remove the files. If removing a file fails, it is left without a row,
// never a row without its file.

export async function deleteVehicleWithFiles(
  supabase: BrowserClient,
  vehicleId: string
): Promise<{ error?: string }> {
  const [{ data: documents }, { data: reports }] = await Promise.all([
    supabase
      .from("vehicle_documents")
      .select("file_path")
      .eq("vehicle_id", vehicleId),
    supabase.from("damage_reports").select("id").eq("vehicle_id", vehicleId),
  ]);

  const reportIds = (reports ?? []).map((report) => report.id);
  const { data: photos } =
    reportIds.length > 0
      ? await supabase
          .from("damage_report_photos")
          .select("file_path")
          .in("damage_report_id", reportIds)
      : { data: [] as { file_path: string }[] };

  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);
  if (error) return { error: error.message };

  await Promise.all([
    removeFiles(
      supabase,
      DOCUMENTS_BUCKET,
      (documents ?? []).map((doc) => doc.file_path)
    ),
    removeFiles(
      supabase,
      DAMAGE_PHOTOS_BUCKET,
      (photos ?? []).map((photo) => photo.file_path)
    ),
  ]);
  return {};
}

export async function deleteDamageReportWithFiles(
  supabase: BrowserClient,
  reportId: string
): Promise<{ error?: string }> {
  const { data: photos } = await supabase
    .from("damage_report_photos")
    .select("file_path")
    .eq("damage_report_id", reportId);

  const { error } = await supabase
    .from("damage_reports")
    .delete()
    .eq("id", reportId);
  if (error) return { error: error.message };

  await removeFiles(
    supabase,
    DAMAGE_PHOTOS_BUCKET,
    (photos ?? []).map((photo) => photo.file_path)
  );
  return {};
}
