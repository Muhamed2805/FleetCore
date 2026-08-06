"use client";

import { Search, Truck, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "@/i18n/navigation";
import type { SearchItem } from "@/lib/supabase/queries";

export function GlobalSearch({ items }: { items: SearchItem[] }) {
  const t = useTranslations("dashboardShell");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  const groupLabels: Record<SearchItem["group"], string> = {
    vehicles: t("searchGroups.vehicles"),
    maintenance: t("searchGroups.maintenance"),
  };

  const vehicles = items.filter((item) => item.group === "vehicles");
  const maintenance = items.filter((item) => item.group === "maintenance");

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="text-muted-foreground sm:hidden"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        <span className="sr-only">{t("search.srLabel")}</span>
      </Button>
      <Button
        variant="outline"
        className="hidden w-56 justify-start text-muted-foreground sm:flex sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        {t("search.trigger")}
        <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("search.dialogTitle")}
        description={t("search.dialogDescription")}
      >
        <CommandInput placeholder={t("search.placeholder")} />
        <CommandList>
          <CommandEmpty>{t("search.empty")}</CommandEmpty>
          {vehicles.length > 0 ? (
            <CommandGroup heading={groupLabels.vehicles}>
              {vehicles.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item.href)}
                >
                  <Truck className="size-4" />
                  <span>{item.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {maintenance.length > 0 ? (
            <CommandGroup heading={groupLabels.maintenance}>
              {maintenance.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle}`}
                  onSelect={() => handleSelect(item.href)}
                >
                  <Wrench className="size-4" />
                  <span>{item.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
