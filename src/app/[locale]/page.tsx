import {
  ArrowRight,
  Bell,
  Receipt,
  ScanText,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BrandMark } from "@/components/brand-mark";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const features = [
  { key: "vehicles", icon: Truck },
  { key: "reminders", icon: Bell },
  { key: "maintenance", icon: Wrench },
  { key: "expenses", icon: Receipt },
  { key: "ai", icon: ScanText },
  { key: "team", icon: Users },
] as const;

export default async function Home({ params }: PageProps<"/[locale]">) {
  // The root layout has already rejected unknown locales.
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tShell] = await Promise.all([
    getTranslations("landing"),
    getTranslations("dashboardShell"),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-[15px] font-semibold tracking-tight"
          >
            <BrandMark />
            {t("header.brand")}
          </Link>
          <div className="flex items-center gap-1">
            <div className="hidden sm:block">
              <LanguageSelector variant="ghost" />
            </div>
            <ThemeToggle variant="ghost" />
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost" })}
            >
              {t("header.logIn")}
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants(), "hidden sm:inline-flex")}
            >
              {t("header.signUp")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="bg-grid absolute inset-0 mask-[radial-gradient(ellipse_at_top,black_25%,transparent_70%)]"
          />
          <div
            aria-hidden
            className="absolute -top-40 left-1/2 h-120 w-220 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl dark:bg-indigo-500/15"
          />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pt-20 pb-14 text-center sm:px-6 sm:pt-28">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs backdrop-blur">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t("hero.badge")}
            </span>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                {t("hero.getStarted")}
                <ArrowRight />
              </Link>
              <a
                href="#features"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                {t("hero.secondary")}
              </a>
            </div>
          </div>
          <div className="relative mx-auto max-w-5xl px-4 pb-20 sm:px-6">
            <ProductPreview
              nav={[
                tShell("nav.overview"),
                tShell("nav.vehicles"),
                tShell("nav.maintenance"),
                tShell("nav.expenses"),
                tShell("nav.reminders"),
              ]}
              stats={[
                { label: tShell("overview.stats.vehicles"), value: "24" },
                { label: tShell("overview.stats.expiringSoon"), value: "3" },
                { label: tShell("overview.stats.openMaintenance"), value: "5" },
                {
                  label: tShell("overview.stats.expensesThisMonth"),
                  value: "$4,210",
                },
              ]}
            />
          </div>
        </section>

        <section id="features" className="scroll-mt-16 border-t bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold text-primary dark:text-indigo-300">
                {t("features.eyebrow")}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {t("features.title")}
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground">
                {t("features.subtitle")}
              </p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="rounded-xl border bg-card p-6 shadow-xs transition-shadow hover:shadow-md dark:shadow-none"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 ring-inset dark:text-indigo-300">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">
                    {t(`features.items.${key}.title`)}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {t(`features.items.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl bg-sidebar px-6 py-14 text-center sm:px-12">
              <div
                aria-hidden
                className="absolute -top-24 left-1/2 h-64 w-160 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl"
              />
              <div className="relative">
                <h2 className="text-3xl font-semibold tracking-tight text-balance text-white">
                  {t("cta.title")}
                </h2>
                <p className="mt-3 text-sidebar-foreground/70">
                  {t("cta.description")}
                </p>
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "mt-8 bg-white text-slate-900 shadow-none inset-shadow-none hover:bg-white/90"
                  )}
                >
                  {t("header.signUp")}
                  <ArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <BrandMark className="size-6 rounded-md [&_svg]:size-3.5" />
            {t("header.brand")}
          </span>
          <p>{t("footer.tagline")}</p>
        </div>
      </footer>
    </div>
  );
}

// An illustration of the dashboard. Decorative, so it's hidden from
// assistive technology; the figures are made up.
function ProductPreview({
  nav,
  stats,
}: {
  nav: string[];
  stats: { label: string; value: string }[];
}) {
  return (
    <div
      aria-hidden
      className="rounded-2xl border bg-card/60 p-2 shadow-2xl shadow-indigo-500/10 backdrop-blur"
    >
      <div className="flex overflow-hidden rounded-xl border bg-background">
        <div className="hidden w-44 shrink-0 flex-col gap-1 bg-sidebar p-3 sm:flex">
          <div className="mb-3 flex items-center gap-2 px-1.5 py-1">
            <BrandMark className="size-5 rounded-md [&_svg]:size-3" />
            <span className="h-2 w-16 rounded bg-white/20" />
          </div>
          {nav.map((label, index) => (
            <div
              key={label}
              className={cn(
                "flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-[11px] font-medium",
                index === 0 ? "bg-white/10 text-white" : "text-white/50"
              )}
            >
              <span
                className={cn(
                  "size-2.5 shrink-0 rounded-sm",
                  index === 0 ? "bg-indigo-400" : "bg-white/20"
                )}
              />
              {label}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="h-3 w-32 rounded bg-foreground/15" />
            <span className="h-6 w-20 rounded-md bg-primary" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border bg-card p-3 text-left"
              >
                <p className="truncate text-[11px] text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-5">
            <div className="rounded-lg border bg-card p-3 lg:col-span-3">
              <span className="block h-2 w-24 rounded bg-foreground/15" />
              <div className="mt-4 flex h-28 items-end gap-2">
                {[40, 65, 50, 80, 60, 95].map((height) => (
                  <div
                    key={height}
                    className="flex-1 rounded-t-md bg-linear-to-t from-indigo-500/70 to-indigo-400"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3 lg:col-span-2">
              <span className="block h-2 w-20 rounded bg-foreground/15" />
              <div className="mt-4 flex flex-col gap-3">
                {[
                  ["bg-emerald-500", "w-4/5"],
                  ["bg-amber-500", "w-1/2"],
                  ["bg-sky-500", "w-1/3"],
                  ["bg-rose-500", "w-1/5"],
                ].map(([color, width]) => (
                  <div key={color} className="flex items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", color)} />
                    <span className="h-2 flex-1 rounded bg-muted">
                      <span className={cn("block h-2 rounded", color, width)} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
