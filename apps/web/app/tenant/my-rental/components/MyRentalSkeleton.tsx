import { Skeleton } from "@heroui/react";

type MyRentalSkeletonProps = {
  variant?: "tenancy" | "applications";
};

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function ApplicationCardSkeleton() {
  return (
    <div className="flex min-h-40 overflow-hidden rounded-2xl border border-border bg-card">
      <Sk className="w-28 shrink-0 rounded-none sm:w-40" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sk className="size-5 rounded-md" />
          <Sk className="h-6 w-36 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
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
      <div className="space-y-3">
        <Sk className="h-3 w-36 rounded-lg" />
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Sk className="h-9 w-64 rounded-lg" />
            <Sk className="h-4 w-80 max-w-full rounded-lg" />
          </div>
          <Sk className="h-7 w-24 rounded-full" />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-4 lg:col-span-2">
          <Sk className="h-3 w-24 rounded-lg" />
          <Sk className="h-10 w-40 rounded-lg" />
          <div className="flex gap-2">
            <Sk className="h-6 w-28 rounded-full" />
            <Sk className="h-6 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
            <Sk className="h-10 rounded-lg" />
            <Sk className="h-10 rounded-lg" />
            <Sk className="h-10 rounded-lg" />
          </div>
          <Sk className="h-9 w-24 rounded-full" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Sk className="h-5 w-28 rounded-lg" />
          <Sk className="mx-auto mt-5 aspect-square w-full max-w-52 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Sk className="h-3 w-28 rounded-lg" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Sk key={index} className="h-20 rounded-xl" />
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
    </>
  );
}

export default function MyRentalSkeleton({ variant = "tenancy" }: MyRentalSkeletonProps) {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading my rental">
      <div className="max-w-7xl mx-auto space-y-4 px-4 py-8">
        {variant === "applications" ? <ApplicationsSkeleton /> : <TenancySkeleton />}
      </div>
    </div>
  );
}
