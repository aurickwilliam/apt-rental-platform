export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-4 p-4"
      role="status"
      aria-label="Loading apartment details"
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="space-y-3">
          <div className="h-128 animate-pulse rounded-3xl bg-muted" />
          <div className="h-32 animate-pulse rounded-3xl bg-muted" />
        </div>
        <div className="space-y-3">
          <div className="h-44 animate-pulse rounded-3xl bg-muted" />
          <div className="h-32 animate-pulse rounded-3xl bg-muted" />
        </div>
      </div>
      <span className="sr-only">Loading apartment details</span>
    </div>
  );
}
