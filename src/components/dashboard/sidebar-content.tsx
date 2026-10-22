"use client";

import { useTranslations } from "next-intl";

import { BrandMark } from "@/components/brand-mark";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Link } from "@/i18n/navigation";
import type { UserRole } from "@/lib/supabase/types";

// What the desktop sidebar and the mobile menu both show: logo,
// navigation and the company the user is signed in to.
export function SidebarContent({
  role,
  roleLabel,
  companyName,
  onNavigate,
}: {
  role: UserRole;
  roleLabel: string;
  companyName: string | null;
  onNavigate?: () => void;
}) {
  const t = useTranslations("dashboardShell");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md font-heading text-[15px] font-semibold tracking-tight text-sidebar-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <BrandMark />
          {t("brand")}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <SidebarNav role={role} onNavigate={onNavigate} />
      </div>
      <div className="shrink-0 border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-1.5 py-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent font-heading text-sm font-semibold text-sidebar-accent-foreground ring-1 ring-sidebar-border ring-inset">
            {(companyName?.trim()[0] ?? "F").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
              {companyName ?? t("brand")}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/50">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
