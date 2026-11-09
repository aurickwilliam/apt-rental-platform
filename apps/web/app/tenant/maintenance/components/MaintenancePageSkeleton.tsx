import { Card, Skeleton } from "@heroui/react";

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

function RequestListSkeleton({ compact = false }: { compact?: boolean }) {
  if (!compact) return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <Card.Content style={{ padding: 4 }}>
        <div className="mb-5 flex items-start gap-3">
          <Sk className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2"><Sk className="h-7 w-64 max-w-full rounded-lg" /><Sk className="h-5 w-72 max-w-full rounded-lg" /></div>
        </div>
        <Card className="rounded-xl border border-border" style={{ boxShadow: "none" }}>
          <Card.Content style={{ padding: 4 }}>
            <div className="flex flex-wrap justify-between gap-2"><Sk className="h-7 w-44 max-w-full rounded-lg" /><Sk className="h-6 w-32 rounded-full" /></div>
            <Sk className="mt-2 h-5 w-72 max-w-full rounded-lg" />
            <div className="mt-4 grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
              <Sk className="size-24 shrink-0 rounded-lg sm:size-32" />
              <div className="min-w-0 space-y-2">
                <Sk className="h-5 w-24 rounded-lg" />
                <Sk className="h-16 w-full rounded-xl" />
                <div className="flex justify-end"><Sk className="h-8 w-40 max-w-full rounded-xl" /></div>
              </div>
            </div>
          </Card.Content>
        </Card>
      </Card.Content>
    </Card>
  );
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <Card.Content style={{ padding: 4 }}>
        <div className="mb-5 flex items-start gap-3">
          <Sk className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2"><Sk className="h-7 w-80 max-w-full rounded-lg" /><Sk className="h-5 w-72 max-w-full rounded-lg" /></div>
        </div>
        <div className="space-y-2">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
              <div className="min-w-0 flex-1 basis-72 space-y-2">
                <Sk className="h-7 w-48 max-w-full rounded-lg" />
                <Sk className="h-5 w-80 max-w-full rounded-lg" />
              </div>
              <div className="flex flex-wrap items-center gap-3"><Sk className="h-7 w-20 rounded-full" /><Sk className="h-7 w-24 rounded-full" /><Sk className="h-10 w-36 rounded-xl" /></div>
            </div>
          ))}
        </div>
      </Card.Content>
    </Card>
  );
}

export default function MaintenancePageSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading maintenance page">
      {showHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Sk className="size-11 shrink-0 rounded-lg" />
              <Sk className="h-9 w-52 max-w-full rounded-lg" />
            </div>
            <Sk className="h-4 w-full max-w-xl rounded-lg" />
          </div>
          <Sk className="ml-auto h-10 w-52 self-end rounded-full" />
        </div>
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="min-w-0 lg:col-span-2 lg:grid"><RequestListSkeleton /></div>
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <Card.Content style={{ padding: 4 }}>
            <div className="mb-4 flex items-center gap-3"><Sk className="size-11 shrink-0 rounded-xl" /><Sk className="h-7 w-28 rounded-lg" /></div>
            <div className="space-y-4">
              <Card className="rounded-xl border border-border" style={{ boxShadow: "none" }}>
                <div className="flex items-center justify-between gap-3"><Sk className="h-6 w-36 max-w-full rounded-lg" /><Sk className="size-12 shrink-0 rounded-xl" /></div>
                <Sk className="h-5 w-48 max-w-full rounded-lg" />
              </Card>
              <Card className="rounded-xl border border-border" style={{ boxShadow: "none" }}>
                <div className="flex items-center justify-between gap-3"><Sk className="h-6 w-40 max-w-full rounded-lg" /><Sk className="h-12 w-20 shrink-0 rounded-xl" /></div>
                <Sk className="h-16 w-full rounded-lg" />
              </Card>
            </div>
          </Card.Content>
        </Card>
      </div>
      <RequestListSkeleton compact />
    </div>
  );
}
