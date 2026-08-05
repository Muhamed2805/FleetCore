"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { checkRemindersNow } from "@/app/dashboard/reminders/actions";
import { Button } from "@/components/ui/button";

export function CheckRemindersButton() {
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
        ? "No new reminders due."
        : `${response.created} new reminder${response.created === 1 ? "" : "s"} created.`
    );
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={handleClick} disabled={isChecking}>
        <RefreshCw className={`size-4 ${isChecking ? "animate-spin" : ""}`} />
        {isChecking ? "Checking…" : "Check now"}
      </Button>
      {result ? (
        <span className="text-sm text-muted-foreground">{result}</span>
      ) : null}
    </div>
  );
}
