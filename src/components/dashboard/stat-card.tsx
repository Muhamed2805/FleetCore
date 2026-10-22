import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  indigo:
    "bg-indigo-50 text-indigo-600 ring-indigo-600/15 dark:bg-indigo-400/10 dark:text-indigo-300 dark:ring-indigo-400/20",
  amber:
    "bg-amber-50 text-amber-600 ring-amber-600/15 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
  sky: "bg-sky-50 text-sky-600 ring-sky-600/15 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20",
  emerald:
    "bg-emerald-50 text-emerald-600 ring-emerald-600/15 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
};

export function StatCard({
  title,
  value,
  hint,
  icon: Icon,
  tone = "indigo",
}: {
  title: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <Card className="flex-row items-start justify-between gap-4 px-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 font-heading text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          tones[tone]
        )}
      >
        <Icon className="size-5" />
      </span>
    </Card>
  );
}
