import {
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  Receipt,
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

export const navItems: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Vehicles", href: "/dashboard/vehicles", icon: Truck },
  { title: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { title: "Documents", href: "/dashboard/documents", icon: FileText },
  { title: "Expenses", href: "/dashboard/expenses", icon: Receipt },
  { title: "Reminders", href: "/dashboard/reminders", icon: Bell },
  { title: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { title: "Team", href: "/dashboard/team", icon: Users, roles: ["admin"] },
];
