import { Skeleton } from "@heroui/react";
import RentFinanceSkeleton from "./RentFinanceSkeleton";
import PaymentHistorySkeleton from "./PaymentHistorySkeleton";

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
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

      <RentFinanceSkeleton />

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

      <div className="grid min-w-0 gap-3 @min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] items-stretch">
        <div className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Sk className="h-4 w-28 rounded-lg" />
            <Sk className="h-4 w-24 rounded-lg" />
          </div>
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <Sk className="size-7 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-4 w-32 max-w-full rounded-lg" />
                <Sk className="h-3 w-48 max-w-full rounded-lg" />
              </div>
              <Sk className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
        <div className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <Sk className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Sk className="h-4 w-28 rounded-lg" />
              <Sk className="h-3 w-full rounded-lg" />
              <Sk className="h-3 w-3/4 rounded-lg" />
            </div>
          </div>
          <Sk className="h-5 w-24 rounded-full" />
          <Sk className="h-9 w-full rounded-full" />
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Sk className="h-4 w-32 rounded-lg" />
          <Sk className="h-3 w-40 rounded-lg" />
        </div>
        <PaymentHistorySkeleton />
      </div>
    </>
  );
}

export default function MyRentalSkeleton() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading my rental">
      <div className="@container/rental min-w-0 space-y-4 px-4 py-6 sm:py-8">
        <TenancySkeleton />
      </div>
    </div>
  );
}
