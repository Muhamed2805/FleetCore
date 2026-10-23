import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/brand-mark";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/i18n/navigation";

// Layout for sign-in, sign-up, password and invitation pages: a dark
// brand panel on wide screens, the form on the right.
export function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("landing");

  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="bg-grid absolute inset-0 [--grid-line:oklch(1_0_0/4%)] mask-[linear-gradient(to_bottom,black,transparent)]"
        />
        <div
          aria-hidden
          className="absolute -top-32 -left-32 size-120 rounded-full bg-indigo-500/25 blur-3xl"
        />
        <Link
          href="/"
          className="relative flex w-fit items-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-white"
        >
          <BrandMark className="size-8" />
          {t("header.brand")}
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-balance text-white">
            {t("hero.title")}
          </h2>
          <p className="mt-4 text-pretty text-sidebar-foreground/70">
            {t("hero.description")}
          </p>
          <ul className="mt-8 flex flex-col gap-3 text-sm">
            {[
              t("features.items.vehicles.title"),
              t("features.items.reminders.title"),
              t("features.items.maintenance.title"),
              t("features.items.ai.title"),
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-sidebar-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-sidebar-foreground/40">
          {t("footer.tagline")}
        </p>
      </aside>
      <div className="relative flex flex-col">
        <div className="flex items-center justify-between gap-2 p-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading font-semibold tracking-tight lg:invisible"
          >
            <BrandMark />
            {t("header.brand")}
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSelector variant="ghost" compact="xs" />
            <ThemeToggle variant="ghost" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pt-4 pb-16">
          <div className="flex w-full max-w-sm flex-col items-stretch">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
