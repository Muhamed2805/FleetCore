import {
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
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

// A titled section of the sidebar. The first one has no title.
export type NavGroup = {
  title: string | null;
  items: NavItem[];
};

type Translate = (key: string) => string;

export function getNavGroups(t: Translate): NavGroup[] {
  return [
    {
      title: null,
      items: [
        { title: t("nav.overview"), href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: t("navGroups.fleet"),
      items: [
        { title: t("nav.vehicles"), href: "/dashboard/vehicles", icon: Truck },
        {
          title: t("nav.maintenance"),
          href: "/dashboard/maintenance",
          icon: Wrench,
        },
        {
          title: t("nav.damageReports"),
          href: "/dashboard/damage-reports",
          icon: TriangleAlert,
        },
        {
          title: t("nav.documents"),
          href: "/dashboard/documents",
          icon: FileText,
        },
      ],
    },
    {
      title: t("navGroups.planning"),
      items: [
        { title: t("nav.expenses"), href: "/dashboard/expenses", icon: Receipt },
        { title: t("nav.reminders"), href: "/dashboard/reminders", icon: Bell },
        { title: t("nav.calendar"), href: "/dashboard/calendar", icon: Calendar },
      ],
    },
    {
      title: t("navGroups.organization"),
      items: [
        {
          title: t("nav.team"),
          href: "/dashboard/team",
          icon: Users,
          roles: ["admin"],
        },
        {
          title: t("nav.settings"),
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];
}
