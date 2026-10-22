"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { removeMember, updateMemberRole } from "@/app/[locale]/dashboard/team/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "@/i18n/navigation";
import type { UserRole } from "@/lib/supabase/types";
import { getRoleLabels } from "@/lib/team";
import { formatDate } from "@/lib/vehicles";

export type TeamMember = {
  id: string;
  full_name: string | null;
  email: string;
  role: UserRole;
  created_at: string;
};

function initials(name: string | null, email: string) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function MembersTable({
  members,
  currentUserId,
}: {
  members: TeamMember[];
  currentUserId: string;
}) {
  const t = useTranslations("team");
  const router = useRouter();
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const roleLabels = getRoleLabels(t);

  async function handleRoleChange(memberId: string, role: UserRole) {
    setPendingMemberId(memberId);
    setError(null);

    const result = await updateMemberRole(memberId, role);

    setPendingMemberId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("members.headers.member")}</TableHead>
              <TableHead>{t("members.headers.role")}</TableHead>
              <TableHead>{t("members.headers.joined")}</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isSelf = member.id === currentUserId;
              const displayName = member.full_name ?? member.email;

              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">
                          {initials(member.full_name, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {displayName}
                          </span>
                          {isSelf ? (
                            <Badge variant="secondary">{t("members.you")}</Badge>
                          ) : null}
                        </div>
                        {member.full_name ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {member.email}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isSelf ? (
                      <Badge variant="outline">{roleLabels[member.role]}</Badge>
                    ) : (
                      <Select
                        value={member.role}
                        disabled={pendingMemberId === member.id}
                        onValueChange={(value) => {
                          if (value && value !== member.role) {
                            handleRoleChange(member.id, value as UserRole);
                          }
                        }}
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-40"
                          aria-label={t("members.changeRole", { name: displayName })}
                        >
                          <SelectValue>
                            {(value: UserRole | null) =>
                              value ? roleLabels[value] : ""
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(member.created_at)}
                  </TableCell>
                  <TableCell>
                    {isSelf ? null : (
                      <ConfirmDeleteDialog
                        title={t("members.removeTitle", { name: displayName })}
                        description={t("members.removeDescription")}
                        onConfirm={() => removeMember(member.id)}
                        trigger={
                          <Button variant="ghost" size="icon-sm">
                            <Trash2 className="size-4" />
                            <span className="sr-only">
                              {t("members.remove", { name: displayName })}
                            </span>
                          </Button>
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
