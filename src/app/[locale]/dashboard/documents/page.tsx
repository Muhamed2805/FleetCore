import { FileText } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const t = await getTranslations("dashboardShell");

  return (
    <ComingSoon
      icon={FileText}
      title={t("documentsPage.title")}
      description={t("documentsPage.description")}
    />
  );
}
