"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { SidebarContent } from "@/components/dashboard/sidebar-content";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { UserRole } from "@/lib/supabase/types";

export function MobileNav({
  role,
  roleLabel,
  companyName,
}: {
  role: UserRole;
  roleLabel: string;
  companyName: string | null;
}) {
  const t = useTranslations("dashboardShell");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" />}
      >
        <Menu className="size-5" />
        <span className="sr-only">{t("sidebar.openNavigation")}</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="dark w-72 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetTitle className="sr-only">{t("brand")}</SheetTitle>
        <SidebarContent
          role={role}
          roleLabel={roleLabel}
          companyName={companyName}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
