import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export default async function DashboardNotFound() {
  const t = await getTranslations("dashboardShell");

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-medium">{t("dashboardNotFound.title")}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("dashboardNotFound.description")}
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          {t("dashboardNotFound.backToDashboard")}
        </Button>
      </CardContent>
    </Card>
  );
}
