"use client";

import { Search, Truck, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
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
import type { SearchItem } from "@/lib/supabase/queries";

export function GlobalSearch({ items }: { items: SearchItem[] }) {
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

  const vehicles = items.filter((item) => item.group === "Vehicles");
  const maintenance = items.filter((item) => item.group === "Maintenance");

  return (
    <>
      <Button
        variant="outline"
        className="w-56 justify-start text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search…
        <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search"
        description="Search vehicles and maintenance jobs"
      >
        <CommandInput placeholder="Search vehicles, plates, maintenance…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {vehicles.length > 0 ? (
            <CommandGroup heading="Vehicles">
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
            <CommandGroup heading="Maintenance">
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
