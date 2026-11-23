import { Skeleton } from "@heroui/react";
import RentFinanceSkeleton from "./RentFinanceSkeleton";
import PaymentHistorySkeleton from "./PaymentHistorySkeleton";

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

const CARD = "@container/dashboard min-w-0 rounded-3xl border border-border bg-card p-4";
const TWO_COLUMNS = "grid min-w-0 gap-3 @min-[56rem]/rental:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]";

function TenancySkeleton() {
  return (
    <>
      <div className={TWO_COLUMNS}>
        <Sk className="h-60 w-full rounded-3xl sm:h-72 @min-[56rem]/rental:h-full @min-[56rem]/rental:min-h-80" />
        <RentFinanceSkeleton />
      </div>

      <div className={`${TWO_COLUMNS} @min-[56rem]/rental:items-start`}>
        <div className="flex min-w-0 flex-col gap-3">
          <div className={CARD}>
            <div className="flex items-center justify-between gap-3">
              <Sk className="h-5 w-32 rounded-lg" />
              <Sk className="size-8 rounded-lg" />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <Sk className="size-12 shrink-0 rounded-xl" />
                  <Sk className="h-3 w-12 max-w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className={`${CARD} space-y-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Sk className="h-5 w-28 rounded-lg" />
              <div className="flex items-center gap-3">
                <Sk className="h-7 w-20 rounded-full" />
                <Sk className="h-8 w-24 rounded-full" />
              </div>
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="space-y-2 rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <Sk className="h-4 w-40 max-w-full rounded-lg" />
                  <Sk className="h-5 w-16 rounded-full" />
                </div>
                <Sk className="h-3 w-32 rounded-lg" />
                <Sk className="h-3 w-48 max-w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className={`${CARD} space-y-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Sk className="h-5 w-36 rounded-lg" />
              <Sk className="h-4 w-14 rounded-lg" />
            </div>
            <PaymentHistorySkeleton />
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div className={CARD}>
            <div className="flex items-center gap-3">
              <Sk className="size-14 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-4 w-28 rounded-lg" />
                <Sk className="h-3 w-16 rounded-lg" />
              </div>
              <Sk className="size-12 shrink-0 rounded-xl" />
            </div>
          </div>

          <div className={`${CARD} space-y-4`}>
            <div className="flex items-center justify-between gap-3">
              <Sk className="h-5 w-24 rounded-lg" />
              <Sk className="h-5 w-24 rounded-full" />
            </div>
            <Sk className="h-2 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-2">
              <Sk className="h-14 rounded-2xl" />
              <Sk className="h-14 rounded-2xl" />
            </div>
            <div className="flex items-start gap-3 border-t border-border pt-4">
              <Sk className="size-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-4 w-28 rounded-lg" />
                <Sk className="h-3 w-full rounded-lg" />
              </div>
            </div>
            <Sk className="h-9 w-full rounded-full" />
          </div>

          <div className={`${CARD} space-y-3`}>
            <div className="flex items-center gap-3">
              <Sk className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-5 w-32 rounded-lg" />
                <Sk className="h-3 w-44 max-w-full rounded-lg" />
              </div>
              <Sk className="h-6 w-24 shrink-0 rounded-full" />
            </div>
            <Sk className="h-9 w-44 rounded-full" />
          </div>
        </div>
      </div>
    </>
  );
}

export default function MyRentalSkeleton() {
  return (
    <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading my rental">
      <div className="@container/rental min-w-0 space-y-3 px-4 pt-4 pb-6 sm:pb-8">
        <TenancySkeleton />
      </div>
    </div>
  );
}
