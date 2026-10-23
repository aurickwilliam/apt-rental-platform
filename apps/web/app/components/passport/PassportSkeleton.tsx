import { Skeleton } from "@heroui/react";

// Loading states that mirror the real Passport layouts card for card, so
// nothing moves when the data arrives.

const CARD = "rounded-2xl border border-border bg-card";

// Darker-than-default base so the shimmer reads clearly; the `!` beats
// @heroui/styles' unlayered CSS (same as app/(main)/loading.tsx).
function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

function CardHeaderSkeleton({ titleWidth, withSubtitle = true }: { titleWidth: string; withSubtitle?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2">
        <Sk className={`h-6 ${titleWidth} rounded-lg`} />
        {withSubtitle ? <Sk className="h-4 w-28 rounded-lg" /> : null}
      </div>
      <Sk className="h-6 w-20 rounded-full" />
    </div>
  );
}

function DocumentCardSkeleton() {
  return (
    <div className={`flex flex-col overflow-hidden ${CARD}`}>
      <Sk className="aspect-[4/3] w-full rounded-none border-b border-border" />
      <div className="space-y-2 p-3">
        <Sk className="h-5 w-3/4 rounded-lg" />
        <Sk className="h-3 w-full rounded-lg" />
        <Sk className="h-6 w-24 rounded-full" />
      </div>
    </div>
  );
}

/** Body of the wallet page (below the header). */
export function PassportWalletSkeleton({ showApplicationReadiness = true }: { showApplicationReadiness?: boolean }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]" aria-hidden="true">
      <div className="space-y-4">
        <div className={`space-y-3 p-4 ${CARD}`}>
          <CardHeaderSkeleton titleWidth="w-36" />
          <Sk className="aspect-video w-full rounded-xl" />
        </div>

        {showApplicationReadiness ? (
          <div className={`space-y-3 p-4 ${CARD}`}>
            <CardHeaderSkeleton titleWidth="w-48" withSubtitle={false} />
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <Sk className="size-7 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Sk className="h-4 w-32 rounded-lg" />
                    <Sk className="h-3 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className={`space-y-4 p-4 sm:p-5 ${CARD}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Sk className="h-6 w-48 rounded-lg" />
            <Sk className="h-4 w-24 rounded-lg" />
          </div>
          <div className="flex gap-1">
            <Sk className="size-8 rounded-full" />
            <Sk className="size-8 rounded-full" />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <DocumentCardSkeleton />
          <DocumentCardSkeleton />
          <div className="min-h-48 rounded-2xl border-2 border-dashed border-border" />
        </div>
      </div>
    </div>
  );
}

/** Body of the document detail page (below the back link). */
export function PassportDetailSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]" aria-hidden="true">
      <Sk className="aspect-[4/3] max-h-[70vh] w-full rounded-2xl" />

      <div className="space-y-4">
        <div className={`space-y-4 p-4 ${CARD}`}>
          <div className="flex items-start gap-3">
            <Sk className="size-12 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <Sk className="h-6 w-40 rounded-lg" />
              <Sk className="h-6 w-24 rounded-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Sk className="h-4 w-full rounded-lg" />
            <Sk className="h-4 w-2/3 rounded-lg" />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Sk className="h-4 w-20 rounded-lg" />
                <Sk className="h-4 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Sk className="h-10 w-full rounded-full" />
          <Sk className="h-10 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
