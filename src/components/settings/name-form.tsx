"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import {
  updateCompanyName,
  updateProfileName,
} from "@/app/[locale]/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fields = {
  fullName: { action: updateProfileName, autoComplete: "name" },
  companyName: { action: updateCompanyName, autoComplete: "organization" },
} as const;

// One editable name: the user's own (profile card) or the company's
// (company card, admins only).
export function NameForm({
  field,
  initialValue,
}: {
  field: keyof typeof fields;
  initialValue: string;
}) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const { action, autoComplete } = fields[field];
  const isUnchanged = value.trim() === saved;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    const result = await action(value);

    if (result.error) {
      setStatus("idle");
      setError(result.error);
      return;
    }

    const trimmed = value.trim();
    setValue(trimmed);
    setSaved(trimmed);
    setStatus("saved");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={field}>{t(`${field}.label`)}</Label>
        <Input
          id={field}
          autoComplete={autoComplete}
          maxLength={100}
          required
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setStatus("idle");
          }}
          className="max-w-sm"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={status === "saving" || isUnchanged}>
          {status === "saving" ? tCommon("actions.saving") : tCommon("actions.saveChanges")}
        </Button>
        {status === "saved" ? (
          <span className="text-sm text-muted-foreground">{t("saved")}</span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
