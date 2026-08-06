import {
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  Receipt,
  TriangleAlert,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/lib/supabase/types";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
};

type Translate = (key: string) => string;

export function getNavItems(t: Translate): NavItem[] {
  return [
    { title: t("nav.overview"), href: "/dashboard", icon: LayoutDashboard },
    { title: t("nav.vehicles"), href: "/dashboard/vehicles", icon: Truck },
    { title: t("nav.maintenance"), href: "/dashboard/maintenance", icon: Wrench },
    {
      title: t("nav.damageReports"),
      href: "/dashboard/damage-reports",
      icon: TriangleAlert,
    },
    { title: t("nav.documents"), href: "/dashboard/documents", icon: FileText },
    { title: t("nav.expenses"), href: "/dashboard/expenses", icon: Receipt },
    { title: t("nav.reminders"), href: "/dashboard/reminders", icon: Bell },
    { title: t("nav.calendar"), href: "/dashboard/calendar", icon: Calendar },
    {
      title: t("nav.team"),
      href: "/dashboard/team",
      icon: Users,
      roles: ["admin"],
    },
  ];
}
