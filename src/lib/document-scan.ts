// Limits shared by the scan buttons and the extraction Server Actions in
// `@/lib/extraction`.

// The file travels in a Server Action request, so it must fit
// `serverActions.bodySizeLimit` in next.config.ts (kept a little above this
// for the multipart overhead) and Vercel's 4.5 MB request limit. Claude also
// rejects images over 5 MB.
export const MAX_SCAN_FILE_MB = 4;
export const MAX_SCAN_FILE_BYTES = MAX_SCAN_FILE_MB * 1024 * 1024;

export const SCANNABLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type ScannableImageType = (typeof SCANNABLE_IMAGE_TYPES)[number];

export const SCANNABLE_FILE_TYPES: readonly string[] = [
  ...SCANNABLE_IMAGE_TYPES,
  "application/pdf",
];

// For <input type="file" accept>.
export const SCAN_ACCEPT = SCANNABLE_FILE_TYPES.join(",");

export function isScannableImageType(type: string): type is ScannableImageType {
  return (SCANNABLE_IMAGE_TYPES as readonly string[]).includes(type);
}

// The reason a file can't be scanned, as a `common.documentScan` message key,
// or null when it can.
export function scanFileProblem(
  file: File
): "unsupportedType" | "fileTooLarge" | null {
  if (!SCANNABLE_FILE_TYPES.includes(file.type)) return "unsupportedType";
  if (file.size > MAX_SCAN_FILE_BYTES) return "fileTooLarge";
  return null;
}
