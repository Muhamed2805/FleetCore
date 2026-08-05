import { Truck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <Truck className="size-5" />
        FleetCore
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Button nativeButton={false} render={<Link href="/" />}>
        Go home
      </Button>
    </div>
  );
}
