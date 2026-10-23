export default function LandlordProfileLoading() {
  return (
    <div className="w-full p-4 md:p-6" role="status" aria-busy="true" aria-label="Loading profile">
      <span className="sr-only">Loading profile…</span>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-3">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="h-28 w-full animate-pulse bg-skeleton sm:h-32" />
            <div className="flex flex-wrap items-start gap-4 p-4">
              <div className="-mt-12 size-24 shrink-0 animate-pulse rounded-full border-4 border-background bg-skeleton" />
              <div className="flex min-w-0 flex-1 basis-48 flex-col gap-2">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-skeleton" />
                <div className="h-4 w-32 animate-pulse rounded bg-skeleton" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-skeleton" />
            <div className="grid gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-skeleton" />
                  <div className="h-5 w-full animate-pulse rounded bg-skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid h-fit grid-cols-1 content-start gap-3">
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-3">
              <div className="h-6 w-44 animate-pulse rounded-lg bg-skeleton" />
              <div className="h-6 w-36 animate-pulse rounded-lg bg-skeleton" />
              <div className="h-4 w-full animate-pulse rounded bg-skeleton" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-skeleton" />
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-4">
              <div className="size-11 animate-pulse rounded-2xl bg-skeleton" />
              <div className="h-5 w-32 animate-pulse rounded-lg bg-skeleton" />
              <div className="h-10 w-full animate-pulse rounded-xl bg-skeleton" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
