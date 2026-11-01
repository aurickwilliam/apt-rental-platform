import { Card, Skeleton } from "@heroui/react";

const REVIEW_PLACEHOLDER_COUNT = 2;

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

export default function RatingsPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl p-4 sm:p-6"
      aria-busy="true"
      aria-label="Loading reviews"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div aria-hidden="true">
            <Sk className="h-5 w-32 rounded-lg" />
          </div>
          <h1 className="mt-2 font-nunito text-2xl font-bold text-foreground md:text-3xl">
            Ratings &amp; Reviews
          </h1>
          <div aria-hidden="true">
            <Sk className="mt-1 h-5 w-72 max-w-full rounded-lg" />
          </div>
        </div>
        <div className="shrink-0" aria-hidden="true">
          <Sk className="h-10 w-36 rounded-full" />
        </div>
      </div>

      <div
        className="mt-6 grid min-w-0 items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]"
        aria-hidden="true"
      >
        <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-1">
          <Card className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
            <div className="flex min-w-0 gap-3 sm:gap-4">
              <Sk className="size-20 shrink-0 rounded-2xl sm:size-24" />
              <div className="min-w-0 flex-1 space-y-2">
                <Sk className="h-5 w-24 max-w-full rounded-full" />
                <Sk className="h-5 w-40 max-w-full rounded-lg" />
                <Sk className="h-4 w-52 max-w-full rounded-lg" />
              </div>
            </div>
            <Sk className="my-3 h-px w-full" />
            <div className="space-y-2">
              <Sk className="h-4 w-full rounded-lg" />
              <Sk className="h-4 w-3/4 rounded-lg" />
            </div>
            <Sk className="mt-3 h-4 w-28 rounded-lg" />
          </Card>

          <Card className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
            <div className="flex flex-col items-center gap-3 py-2">
              <Sk className="h-12 w-20 rounded-lg" />
              <Sk className="h-6 w-32 rounded-lg" />
              <Sk className="h-4 w-36 max-w-full rounded-lg" />
            </div>
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Sk className="h-5 w-8 rounded-lg" />
                  <Sk className="h-2 flex-1 rounded-full" />
                  <Sk className="h-5 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-nunito text-lg font-semibold">Tenant Reviews</h2>
            <Sk className="h-9 w-32 rounded-full" />
          </div>

          {Array.from({ length: REVIEW_PLACEHOLDER_COUNT }, (_, index) => (
            <Card
              key={index}
              className="min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5"
            >
              <div className="flex items-center gap-3">
                <Sk className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Sk className="h-5 w-32 max-w-full rounded-lg" />
                  <Sk className="h-4 w-24 max-w-full rounded-lg" />
                </div>
                <Sk className="h-5 w-24 rounded-lg" />
              </div>
              <div className="mt-3 space-y-2">
                <Sk className="h-4 w-full rounded-lg" />
                <Sk className="h-4 w-5/6 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
