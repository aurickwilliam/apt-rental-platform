import { Skeleton } from "@heroui/react";

/** Three rows shaped like Recent payments: receipt circle, two lines, amount and status chip. */
export default function PaymentHistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading payment history" className="divide-y divide-border">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
          <Skeleton className="size-10 shrink-0 rounded-full bg-skeleton!" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-48 max-w-full rounded-md bg-skeleton!" />
            <Skeleton className="h-3 w-20 rounded-md bg-skeleton!" />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Skeleton className="h-4 w-16 rounded-md bg-skeleton!" />
            <Skeleton className="h-6 w-20 rounded-full bg-skeleton!" />
          </div>
        </div>
      ))}
    </div>
  );
}
