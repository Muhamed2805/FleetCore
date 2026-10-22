import { SidebarContent } from "@/components/dashboard/sidebar-content";
import type { UserRole } from "@/lib/supabase/types";

export function Sidebar({
  role,
  roleLabel,
  companyName,
}: {
  role: UserRole;
  roleLabel: string;
  companyName: string | null;
}) {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
      <SidebarContent
        role={role}
        roleLabel={roleLabel}
        companyName={companyName}
      />
    </aside>
  );
}
