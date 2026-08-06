"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { getNavItems } from "@/lib/nav";
import type { UserRole } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export function SidebarNav({
  role,
  onNavigate,
}: {
  role: UserRole;
  onNavigate?: () => void;
}) {
  const t = useTranslations("dashboardShell");
  const pathname = usePathname();
  const navItems = getNavItems((key) => t(key));

  return (
    <nav className="flex flex-col gap-1">
      {navItems
        .filter((item) => !item.roles || item.roles.includes(role))
        .map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.title}
            </Link>
          );
        })}
    </nav>
  );
}
