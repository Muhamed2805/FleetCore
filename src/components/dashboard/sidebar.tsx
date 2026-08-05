import Link from "next/link";
import { Truck } from "lucide-react";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import type { UserRole } from "@/lib/supabase/types";

export function Sidebar({ role }: { role: UserRole }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <Truck className="size-5" />
          FleetCore
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav role={role} />
      </div>
    </aside>
  );
}
