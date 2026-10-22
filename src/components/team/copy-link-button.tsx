"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyLinkButton({
  url,
  iconOnly = false,
}: {
  url: string;
  iconOnly?: boolean;
}) {
  const t = useTranslations("team");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // The clipboard API needs a secure context (https or localhost).
      window.prompt(t("invitations.copyPrompt"), url);
    }
  }

  const Icon = copied ? Check : Copy;
  const label = copied ? t("invitations.copied") : t("invitations.copyLink");

  if (iconOnly) {
    return (
      <Button variant="ghost" size="icon-sm" onClick={handleCopy}>
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
      </Button>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
      <Icon className="size-4" />
      {label}
    </Button>
  );
}
