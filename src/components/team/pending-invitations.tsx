"use client";

import { RefreshCw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  resendInvitation,
  revokeInvitation,
} from "@/app/[locale]/dashboard/team/actions";
import { CopyLinkButton } from "@/components/team/copy-link-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
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

export type PendingInvitation = {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  expires_at: string;
  isExpired: boolean;
  inviteUrl: string;
};

export function PendingInvitations({
  invitations,
}: {
  invitations: PendingInvitation[];
}) {
  const t = useTranslations("team");
  const router = useRouter();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  const roleLabels = getRoleLabels(t);

  async function handleResend(invitation: PendingInvitation) {
    setResendingId(invitation.id);
    setMessage(null);

    const result = await resendInvitation(invitation.id);

    setResendingId(null);

    if ("error" in result && result.error) {
      setMessage({ text: result.error, isError: true });
      return;
    }

    setMessage({
      text:
        "emailed" in result && result.emailed
          ? t("invitations.resent", { email: invitation.email })
          : t("invitations.newLink", { email: invitation.email }),
      isError: false,
    });
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-medium">{t("invitations.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("invitations.description")}
        </p>
      </div>

      {message ? (
        <p
          className={
            message.isError
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {message.text}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card shadow-xs dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invitations.headers.email")}</TableHead>
              <TableHead>{t("invitations.headers.role")}</TableHead>
              <TableHead>{t("invitations.headers.invited")}</TableHead>
              <TableHead>{t("invitations.headers.expires")}</TableHead>
              <TableHead className="w-28" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell className="font-medium">{invitation.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[invitation.role]}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(invitation.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {invitation.isExpired ? (
                    <Badge variant="destructive">{t("invitations.expired")}</Badge>
                  ) : (
                    formatDate(invitation.expires_at)
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {invitation.isExpired ? null : (
                      <CopyLinkButton url={invitation.inviteUrl} iconOnly />
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={resendingId === invitation.id}
                      onClick={() => handleResend(invitation)}
                    >
                      <RefreshCw
                        className={
                          resendingId === invitation.id
                            ? "size-4 animate-spin"
                            : "size-4"
                        }
                      />
                      <span className="sr-only">
                        {t("invitations.resend", { email: invitation.email })}
                      </span>
                    </Button>
                    <ConfirmDeleteDialog
                      title={t("invitations.revokeTitle", {
                        email: invitation.email,
                      })}
                      description={t("invitations.revokeDescription")}
                      onConfirm={() => revokeInvitation(invitation.id)}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <X className="size-4" />
                          <span className="sr-only">
                            {t("invitations.revoke", { email: invitation.email })}
                          </span>
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
