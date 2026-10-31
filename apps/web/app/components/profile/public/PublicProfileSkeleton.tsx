// Mirrors the loaded public profile (header with its verification strip, side
// column with stats and contact, the listing grid and the review section) so
// the page doesn't jump when it streams in. Carries no private data.
export default function PublicProfileSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-busy="true" aria-label="Loading profile">
      <span className="sr-only">Loading profile…</span>
      <div className="h-10 w-24 animate-pulse rounded-full bg-skeleton" />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="min-w-0 xl:col-start-1 xl:row-start-1">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="h-28 w-full animate-pulse bg-skeleton sm:h-32" />
            <div className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="-mt-12 size-24 shrink-0 animate-pulse rounded-full border-4 border-background bg-skeleton" />
                <div className="flex min-w-0 flex-1 basis-48 flex-col gap-2">
                  <div className="h-8 w-48 animate-pulse rounded-lg bg-skeleton" />
                  <div className="h-4 w-32 animate-pulse rounded bg-skeleton" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <div className="h-6 w-28 animate-pulse rounded-full bg-skeleton" />
                <div className="h-6 w-32 animate-pulse rounded-full bg-skeleton" />
                <div className="h-6 w-24 animate-pulse rounded-full bg-skeleton" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start">
          <div className="h-40 animate-pulse rounded-3xl border border-border bg-skeleton" />
          <div className="h-64 animate-pulse rounded-3xl border border-border bg-skeleton" />
        </div>
        <div className="flex min-w-0 flex-col gap-5 xl:col-start-1 xl:row-start-2">
          <div className="flex flex-col gap-3">
            <div className="h-6 w-40 animate-pulse rounded-lg bg-skeleton" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="aspect-square animate-pulse rounded-xl bg-skeleton" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="h-6 w-36 animate-pulse rounded-lg bg-skeleton" />
            <div className="h-4 w-64 max-w-full animate-pulse rounded bg-skeleton" />
            <div className="h-56 animate-pulse rounded-3xl border border-border bg-skeleton" />
            <div className="h-28 animate-pulse rounded-3xl border border-border bg-skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}
