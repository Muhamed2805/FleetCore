"use client";

import { MailCheck, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { inviteMember } from "@/app/[locale]/dashboard/team/actions";
import { CopyLinkButton } from "@/components/team/copy-link-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import type { UserRole } from "@/lib/supabase/types";
import { getRoleLabels } from "@/lib/team";

type InviteResult = { email: string; inviteUrl: string; emailed: boolean };

export function InviteMemberDialog() {
  const t = useTranslations("team");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("driver");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);

  const roleLabels = getRoleLabels(t);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setEmail("");
      setRole("driver");
      setError(null);
      setResult(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await inviteMember({ email, role });

    setIsSubmitting(false);

    if ("error" in response && response.error) {
      setError(response.error);
      return;
    }

    if ("inviteUrl" in response) {
      setResult({
        email: email.trim().toLowerCase(),
        inviteUrl: response.inviteUrl,
        emailed: response.emailed,
      });
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" />
            {t("actions.invite")}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-muted">
                <MailCheck className="size-5 text-muted-foreground" />
              </div>
              <DialogTitle>{t("inviteDialog.successTitle")}</DialogTitle>
              <DialogDescription>
                {result.emailed
                  ? t("inviteDialog.emailedDescription", { email: result.email })
                  : t("inviteDialog.notEmailedDescription", {
                      email: result.email,
                    })}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inviteLink">{t("inviteDialog.linkLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="inviteLink"
                  readOnly
                  value={result.inviteUrl}
                  onFocus={(event) => event.currentTarget.select()}
                  className="font-mono text-xs"
                />
                <CopyLinkButton url={result.inviteUrl} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>
                {t("inviteDialog.done")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t("inviteDialog.title")}</DialogTitle>
              <DialogDescription>
                {t("inviteDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inviteEmail">{t("inviteDialog.emailLabel")}</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  autoComplete="off"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t("inviteDialog.emailPlaceholder")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t("inviteDialog.roleLabel")}</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole((value as UserRole) ?? "driver")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(value: UserRole | null) => (value ? roleLabels[value] : "")}
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
                <p className="text-xs text-muted-foreground">
                  {t(`roleDescriptions.${role}`)}
                </p>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? t("inviteDialog.submitting")
                    : t("inviteDialog.submit")}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
