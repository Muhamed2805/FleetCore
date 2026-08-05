import Link from "next/link";
import { Truck } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Truck className="size-5" />
          FleetCore
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" nativeButton={false} render={<Link href="/login" />}>
            Log in
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <Badge variant="secondary">Phase 2 — auth &amp; multi-tenancy</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">
          Fleet Management &amp; Maintenance Platform
        </h1>
        <p className="max-w-md text-muted-foreground">
          Manage vehicles, registrations, insurance, inspections, maintenance
          and documents from one dashboard.
        </p>
        <Button size="lg" className="mt-2" nativeButton={false} render={<Link href="/signup" />}>
          Get started
        </Button>
      </main>
    </div>
  );
}
