export default function LandlordProfileLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-4">
      <div className="border border-border bg-card p-6 rounded-2xl">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="size-36 rounded-full bg-default-200 animate-pulse shrink-0" />
          <div className="flex flex-col items-center gap-1.5 min-w-0 sm:items-start">
            <div className="h-8 w-48 rounded-lg bg-default-200 animate-pulse" />
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <div className="h-6 w-20 rounded-full bg-default-200 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-default-200 animate-pulse" />
            </div>
            <div className="h-4 w-56 max-w-full rounded bg-default-200 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="border border-border bg-card p-6 rounded-2xl">
        <div className="h-6 w-40 rounded-lg bg-default-200 animate-pulse mb-4" />
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-3 w-24 rounded bg-default-200 animate-pulse" />
              <div className="h-5 w-full rounded bg-default-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
