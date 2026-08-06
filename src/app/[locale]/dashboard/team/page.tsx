import { Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const t = await getTranslations("dashboardShell");

  return (
    <ComingSoon
      icon={Users}
      title={t("teamPage.title")}
      description={t("teamPage.description")}
    />
  );
}
