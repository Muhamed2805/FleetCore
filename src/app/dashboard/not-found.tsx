import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <SearchX className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="font-medium">Not found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This page, vehicle, or record doesn&apos;t exist or may have been
            removed.
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/dashboard" />}
        >
          Back to dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
