// Lists that can be downloaded as CSV from /dashboard/export/<dataset>.
export const exportDatasets = ["vehicles", "maintenance", "expenses"] as const;

export type ExportDataset = (typeof exportDatasets)[number];

export function isExportDataset(value: string): value is ExportDataset {
  return (exportDatasets as readonly string[]).includes(value);
}
