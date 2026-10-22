import { Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function Home() {
  const t = await getTranslations("landing");

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Truck className="size-5" />
          {t("header.brand")}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
            {t("header.logIn")}
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Badge variant="secondary">{t("hero.badge")}</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("hero.title")}
        </h1>
        <p className="max-w-md text-muted-foreground">{t("hero.description")}</p>
        <Link
          href="/signup"
          className={buttonVariants({ size: "lg", className: "mt-2" })}
        >
          {t("hero.getStarted")}
        </Link>
      </main>
    </div>
  );
}
