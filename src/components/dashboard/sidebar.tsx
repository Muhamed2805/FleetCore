import { Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Link } from "@/i18n/navigation";
import type { UserRole } from "@/lib/supabase/types";

export async function Sidebar({ role }: { role: UserRole }) {
  const t = await getTranslations("dashboardShell");

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
          <Truck className="size-5" />
          {t("brand")}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav role={role} />
      </div>
    </aside>
  );
}
