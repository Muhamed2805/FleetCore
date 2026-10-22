"use client";

import { Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button, buttonVariants } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import type { ExportDataset } from "@/lib/export";

// Downloads the list as CSV with the filters currently applied. A plain link
// rather than client navigation: the route answers with a file
// (Content-Disposition: attachment), so the page stays where it is.
export function ExportButton({
  dataset,
  filters,
  disabled = false,
}: {
  dataset: ExportDataset;
  filters: Record<string, string>;
  disabled?: boolean;
}) {
  const t = useTranslations("export");
  const locale = useLocale();

  if (disabled) {
    return (
      <Button variant="outline" disabled>
        <Download className="size-4" />
        {t("button")}
      </Button>
    );
  }

  const query = new URLSearchParams(
    Object.entries(filters).filter(
      ([, value]) => value.trim() !== "" && value !== "all"
    )
  ).toString();
  const path = getPathname({ href: `/dashboard/export/${dataset}`, locale });

  return (
    <a
      href={query ? `${path}?${query}` : path}
      title={t("hint")}
      className={buttonVariants({ variant: "outline" })}
    >
      <Download className="size-4" />
      {t("button")}
    </a>
  );
}
