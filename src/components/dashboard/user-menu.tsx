import { LogOut } from "lucide-react";

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
import type { UserRole } from "@/lib/supabase/types";

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

export function UserMenu({
  fullName,
  email,
  role,
}: {
  fullName: string | null;
  email: string | null | undefined;
  role: UserRole;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />}
      >
        <Avatar>
          <AvatarFallback>{initials(fullName, email)}</AvatarFallback>
        </Avatar>
        <span className="sr-only">Open user menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-1 py-2">
            <span className="text-sm font-medium">{fullName ?? email}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
            <Badge variant="secondary" className="mt-1 w-fit capitalize">
              {role.replace("_", " ")}
            </Badge>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem variant="destructive" render={<button type="submit" className="w-full" />}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
