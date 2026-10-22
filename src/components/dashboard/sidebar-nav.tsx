"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { getNavGroups } from "@/lib/nav";
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

  const groups = getNavGroups((key) => t(key))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || item.roles.includes(role)
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group, index) => (
        <div key={group.title ?? index} className="flex flex-col gap-0.5">
          {group.title ? (
            <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
              {group.title}
            </p>
          ) : null}
          {group.items.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "size-4 transition-colors",
                    isActive
                      ? "text-sidebar-primary"
                      : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80"
                  )}
                />
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
