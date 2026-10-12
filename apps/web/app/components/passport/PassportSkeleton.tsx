// Loading states that mirror the real Passport layouts card for card, so
// nothing moves when the data arrives.

const BLOCK = "animate-pulse rounded-lg bg-default-200";
const CARD = "rounded-2xl border border-border bg-card";

function CardHeaderSkeleton({ titleWidth, withSubtitle = true }: { titleWidth: string; withSubtitle?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2">
        <div className={`h-6 ${titleWidth} ${BLOCK}`} />
        {withSubtitle ? <div className={`h-4 w-28 ${BLOCK}`} /> : null}
      </div>
      <div className={`h-6 w-20 rounded-full ${BLOCK}`} />
    </div>
  );
}

function DocumentCardSkeleton() {
  return (
    <div className={`flex flex-col overflow-hidden ${CARD}`}>
      <div className="aspect-[4/3] w-full animate-pulse border-b border-border bg-default-200" />
      <div className="space-y-2 p-3">
        <div className={`h-5 w-3/4 ${BLOCK}`} />
        <div className={`h-3 w-full ${BLOCK}`} />
        <div className={`h-6 w-24 rounded-full ${BLOCK}`} />
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
          <div className="aspect-video w-full animate-pulse rounded-xl bg-default-200" />
        </div>

        {showApplicationReadiness ? (
          <div className={`space-y-3 p-4 ${CARD}`}>
            <CardHeaderSkeleton titleWidth="w-48" withSubtitle={false} />
            <div className="divide-y divide-border">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className={`size-7 shrink-0 rounded-full ${BLOCK}`} />
                  <div className="flex-1 space-y-1.5">
                    <div className={`h-4 w-32 ${BLOCK}`} />
                    <div className={`h-3 w-24 ${BLOCK}`} />
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
            <div className={`h-6 w-48 ${BLOCK}`} />
            <div className={`h-4 w-24 ${BLOCK}`} />
          </div>
          <div className="flex gap-1">
            <div className={`size-8 rounded-full ${BLOCK}`} />
            <div className={`size-8 rounded-full ${BLOCK}`} />
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
      <div className="aspect-[4/3] max-h-[70vh] w-full animate-pulse rounded-2xl bg-default-200" />

      <div className="space-y-4">
        <div className={`space-y-4 p-4 ${CARD}`}>
          <div className="flex items-start gap-3">
            <div className={`size-12 shrink-0 rounded-2xl ${BLOCK}`} />
            <div className="space-y-2">
              <div className={`h-6 w-40 ${BLOCK}`} />
              <div className={`h-6 w-24 rounded-full ${BLOCK}`} />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className={`h-4 w-full ${BLOCK}`} />
            <div className={`h-4 w-2/3 ${BLOCK}`} />
          </div>
          <div className="space-y-3 border-t border-border pt-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className={`h-4 w-20 ${BLOCK}`} />
                <div className={`h-4 w-28 ${BLOCK}`} />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className={`h-10 w-full rounded-full ${BLOCK}`} />
          <div className={`h-10 w-full rounded-full ${BLOCK}`} />
        </div>
      </div>
    </div>
  );
}
