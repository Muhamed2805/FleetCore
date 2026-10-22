import { getTranslations } from "next-intl/server";

import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("dashboardShell");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden px-6 text-center">
      <div
        aria-hidden
        className="bg-grid absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_20%,transparent_65%)]"
      />
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex items-center gap-2.5 font-heading font-semibold tracking-tight">
          <BrandMark />
          {t("brand")}
        </div>
        <p className="mt-4 font-heading text-7xl font-bold tracking-tight text-primary/90">
          404
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("appNotFound.title")}
        </h1>
        <p className="max-w-sm text-muted-foreground">
          {t("appNotFound.description")}
        </p>
        <Link href="/" className={buttonVariants({ className: "mt-2" })}>
          {t("appNotFound.goHome")}
        </Link>
      </div>
    </div>
  );
}
