"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import { useTransition } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, routing } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

// On narrow screens, a square icon-only trigger for headers that have no
// room for the language name: "sm" below 640 px, "xs" below 360 px. The
// name stays for screen readers; sr-only rather than hidden, because the
// trigger forces its value to display:flex with a more specific selector.
// The last svg is the chevron.
const compactClasses = {
  sm: {
    trigger:
      "max-sm:size-9 max-sm:justify-center max-sm:px-0 max-sm:[&>svg:last-child]:hidden",
    value: "max-sm:sr-only",
  },
  xs: {
    trigger:
      "max-[22.5rem]:size-9 max-[22.5rem]:justify-center max-[22.5rem]:px-0 max-[22.5rem]:[&>svg:last-child]:hidden",
    value: "max-[22.5rem]:sr-only",
  },
};

export function LanguageSelector({
  variant = "outline",
  compact,
}: {
  variant?: "outline" | "ghost";
  compact?: keyof typeof compactClasses;
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(() => {
      router.replace(pathname, { locale: next as Locale });
    });
  }

  return (
    <Select
      value={locale}
      onValueChange={(value) => value && handleChange(value)}
    >
      <SelectTrigger
        disabled={isPending}
        aria-label="Language"
        className={cn(
          "w-auto",
          variant === "ghost" &&
            "border-transparent bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground dark:bg-transparent dark:hover:bg-muted/60",
          compact && compactClasses[compact].trigger
        )}
      >
        <Languages className="size-4" />
        <SelectValue className={cn(compact && compactClasses[compact].value)}>
          {() => localeLabels[locale as Locale]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {routing.locales.map((code) => (
          <SelectItem key={code} value={code}>
            {localeLabels[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
