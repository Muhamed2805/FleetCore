import { Skeleton } from "@/components/ui/skeleton";

export function ListPageSkeleton({ filters = 1 }: { filters?: number }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: filters }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full sm:w-48" />
        ))}
      </div>

      <div className="rounded-xl border">
        <div className="flex flex-col divide-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-3">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="hidden h-4 w-20 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
