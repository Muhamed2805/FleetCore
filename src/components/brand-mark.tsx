import { Truck } from "lucide-react";

import { cn } from "@/lib/utils";

// The FleetCore logo: a truck on an indigo tile.
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 text-white shadow-sm ring-1 ring-white/15 ring-inset",
        className
      )}
    >
      <Truck className="size-4" />
    </span>
  );
}
