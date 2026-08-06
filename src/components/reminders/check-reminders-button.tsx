"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { checkRemindersNow } from "@/app/[locale]/dashboard/reminders/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

export function CheckRemindersButton() {
  const t = useTranslations("reminders");
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setIsChecking(true);
    setResult(null);

    const response = await checkRemindersNow();

    setIsChecking(false);

    if (response.error) {
      setResult(response.error);
      return;
    }

    setResult(
      response.created === 0
        ? t("checkButton.noneDue")
        : t("checkButton.created", { count: response.created ?? 0 })
    );
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={handleClick} disabled={isChecking}>
        <RefreshCw className={`size-4 ${isChecking ? "animate-spin" : ""}`} />
        {isChecking ? t("checkButton.checking") : t("checkButton.checkNow")}
      </Button>
      {result ? (
        <span className="text-sm text-muted-foreground">{result}</span>
      ) : null}
    </div>
  );
}
