import { Skeleton } from "@heroui/react";

/** Shared geometry for the route fallback and the unresolved finance region. */
export default function RentFinanceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading rent details" className="grid min-w-0 gap-3 @min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
      <div className="@container/rent relative min-h-80 min-w-0 rounded-2xl bg-primary p-4 text-white sm:p-6">
        <div className="flex h-full flex-col gap-3">
          <Skeleton className="h-6 w-44 rounded-lg bg-white/25!" />
          <Skeleton className="h-10 w-56 max-w-full rounded-lg bg-white/25!" />
          <Skeleton className="h-4 w-64 max-w-full rounded-md bg-white/20!" />
          <div className="mt-6 grid gap-4 border-t border-white/20 pt-5 @min-[36rem]/rent:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-20 rounded-md bg-white/20!" />
                <Skeleton className="h-4 w-24 rounded-md bg-white/25!" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-auto h-12 w-full rounded-full bg-white/25!" />
        </div>
      </div>
      <div className="min-w-0 rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-5 w-28 rounded-lg bg-skeleton!" />
        <Skeleton className="mx-auto mt-5 aspect-square w-full max-w-52 rounded-xl bg-skeleton!" />
      </div>
    </div>
  );
}
