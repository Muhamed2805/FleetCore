import { Truck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Truck className="size-5" />
          FleetCore
        </div>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Badge variant="secondary">Phase 1 — scaffold</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Fleet Management &amp; Maintenance Platform
        </h1>
        <p className="max-w-md text-muted-foreground">
          Foundation is live: Next.js, Tailwind, shadcn/ui and dark/light
          mode. Auth, dashboard and fleet features come next.
        </p>
      </main>
    </div>
  );
}
