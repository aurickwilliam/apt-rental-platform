import { Skeleton } from "@heroui/react";

type MyRentalSkeletonProps = {
  variant?: "tenancy" | "applications";
};

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function ApplicationCardSkeleton() {
  return (
    <div className="flex min-h-40 flex-col overflow-hidden rounded-2xl border border-border bg-card sm:flex-row">
      <Sk className="h-40 w-full shrink-0 rounded-none sm:h-auto sm:w-40" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Sk className="h-6 w-44 rounded-lg" />
          <Sk className="h-8 w-24 rounded-full" />
        </div>
        <Sk className="h-4 w-full max-w-md rounded-lg" />
        <Sk className="h-4 w-32 rounded-lg" />
        <Sk className="mt-auto h-8 w-28 self-end rounded-full" />
      </div>
    </div>
  );
}

function ApplicationsSkeleton() {
  return (
    <div className="flex flex-col gap-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sk className="size-5 rounded-md" />
          <Sk className="h-6 w-36 rounded-lg" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Sk className="h-4 w-24 rounded-lg" />
          <Sk className="h-8 w-28 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <ApplicationCardSkeleton />
        <ApplicationCardSkeleton />
      </div>
    </div>
  );
}

function TenancySkeleton() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Sk className="h-3 w-36 rounded-lg" />
        <div className="flex items-center gap-2">
          <Sk className="h-8 w-36 rounded-full" />
          <Sk className="h-7 w-24 rounded-full" />
        </div>
      </div>

      <Sk className="h-64 w-full rounded-3xl md:h-80" />

      <div className="grid min-w-0 gap-3 @min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="@container/rent min-w-0 space-y-3 rounded-2xl bg-primary/20 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <Sk className="h-6 w-36 rounded-lg" />
            <Sk className="h-8 w-28 rounded-full" />
          </div>
          <Sk className="h-10 w-48 rounded-lg" />
          <Sk className="h-4 w-64 max-w-full rounded-lg" />
          <div className="grid gap-4 border-t border-border pt-4 @min-[36rem]/rent:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Sk className="size-6 shrink-0 rounded-md" />
                <div className="space-y-1.5">
                  <Sk className="h-3 w-16 rounded-lg" />
                  <Sk className="h-4 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Sk className="h-10 flex-1 rounded-full" />
            <Sk className="size-11 shrink-0 rounded-full" />
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-border bg-card p-4">
          <Sk className="h-5 w-28 rounded-lg" />
          <Sk className="mx-auto mt-5 aspect-square w-full max-w-52 rounded-xl" />
        </div>
      </div>

      <div className="grid min-w-0 gap-3 @min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <div className="@container/dashboard min-w-0 rounded-2xl border border-border bg-card p-4">
          <Sk className="h-3 w-28 rounded-lg" />
          <div className="mt-4 grid auto-rows-fr grid-cols-1 gap-3 @min-[28rem]/dashboard:grid-cols-2 @min-[44rem]/dashboard:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Sk key={index} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <Sk className="h-3 w-20 rounded-lg" />
          <div className="flex items-center gap-3">
            <Sk className="size-10 rounded-full" />
            <div className="space-y-2"><Sk className="h-4 w-28 rounded-lg" /><Sk className="h-3 w-36 rounded-lg" /></div>
          </div>
          <Sk className="h-9 w-full rounded-full" />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Sk className="h-4 w-28 rounded-lg" />
          <Sk className="h-4 w-24 rounded-lg" />
        </div>
        <Sk className="mx-auto h-3 w-48 rounded-lg" />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Sk className="h-4 w-32 rounded-lg" />
          <Sk className="h-3 w-40 rounded-lg" />
        </div>
        {Array.from({ length: 3 }).map((_, index) => (
          <Sk key={index} className="h-8 w-full rounded-lg" />
        ))}
      </div>
    </>
  );
}

export default function MyRentalSkeleton({ variant = "tenancy" }: MyRentalSkeletonProps) {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading my rental">
      <div className="@container/rental max-w-7xl mx-auto min-w-0 space-y-4 px-4 py-6 sm:py-8">
        {variant === "applications" ? <ApplicationsSkeleton /> : <TenancySkeleton />}
      </div>
    </div>
  );
}
