import { Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("dashboardShell");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <Truck className="size-5" />
        {t("brand")}
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("appNotFound.title")}
      </h1>
      <p className="max-w-sm text-muted-foreground">
        {t("appNotFound.description")}
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        {t("appNotFound.goHome")}
      </Button>
    </div>
  );
}
