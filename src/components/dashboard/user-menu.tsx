import { LogOut, Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import type { UserRole } from "@/lib/supabase/types";
import { getRoleLabels } from "@/lib/team";

function initials(name: string | null, email: string | null | undefined) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

export async function UserMenu({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string | null | undefined;
  role: UserRole;
}) {
  const t = await getTranslations("dashboardShell");
  const tTeam = await getTranslations("team");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}
      >
        <Avatar>
          <AvatarFallback>{initials(fullName, email)}</AvatarFallback>
        </Avatar>
        <span className="sr-only">{t("userMenu.openMenu")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1 py-2">
            <span className="text-sm font-medium">{fullName ?? email}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
            <Badge variant="secondary" className="mt-1 w-fit">
              {getRoleLabels(tTeam)[role]}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          <Settings className="size-4" />
          {t("userMenu.settings")}
        </DropdownMenuItem>
        <form action="/auth/signout" method="post">
          <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
            <LogOut className="size-4" />
            {t("userMenu.signOut")}
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
