import { Card, Skeleton } from "@heroui/react";

const STAT_COUNT = 4;
const THUMBNAIL_COUNT = 3;
const DETAIL_FIELD_COUNT = 8;
const PRICING_FIELD_COUNT = 3;

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function FieldSkeleton() {
  return (
    <div className="min-w-0 space-y-1">
      <Sk className="h-5 w-24 max-w-full rounded-lg" />
      <Sk className="h-5 w-20 max-w-full rounded-lg" />
    </div>
  );
}

export default function PropertyDetailSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0" aria-busy="true" aria-label="Loading apartment details">
      <div aria-hidden="true" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Sk className="h-8 w-32 rounded-lg" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Sk className="h-8 w-64 max-w-full rounded-lg" />
                <Sk className="h-5 w-20 rounded-full" />
              </div>
              <Sk className="mt-1 h-5 w-96 max-w-full rounded-lg" />
            </div>
            <div className="flex gap-2 shrink-0">
              <Sk className="h-8 w-32 rounded-full" />
              <Sk className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: STAT_COUNT }, (_, index) => (
            <div key={index} className={`p-4 flex flex-col gap-3 rounded-xl ${index === 0 ? "bg-primary" : "bg-card border border-border"}`}>
              <div className="flex items-center gap-3">
                <Sk className="size-7.5 shrink-0 rounded-md" />
                <Sk className="h-6 w-28 max-w-full rounded-lg" />
              </div>
              <Sk className="h-9 w-28 max-w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3 items-start">
          <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
            <Card className="shadow-none bg-card rounded-3xl border border-border overflow-hidden">
              <Sk className="h-64 sm:h-80 w-full rounded-xl" />
              <Card.Content className="p-4">
                <div className="flex gap-2 overflow-x-auto p-1">
                  {Array.from({ length: THUMBNAIL_COUNT }, (_, index) => <Sk key={index} className="h-20 w-28 shrink-0 rounded-xl" />)}
                </div>
              </Card.Content>
            </Card>

            <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Sk className="size-10 rounded-xl" />
                <Sk className="h-4 w-24 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: DETAIL_FIELD_COUNT }, (_, index) => <FieldSkeleton key={index} />)}
              </div>
              <div className="rounded-2xl bg-muted px-4 py-3 flex items-center justify-between gap-2">
                <Sk className="h-4 w-28 max-w-full rounded-lg" />
                <Sk className="h-6 w-20 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: PRICING_FIELD_COUNT }, (_, index) => <FieldSkeleton key={index} />)}
              </div>
              <div className="space-y-2">
                <Sk className="h-4 w-20 rounded-lg" />
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 3 }, (_, index) => <Sk key={index} className="h-6 w-24 rounded-full" />)}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Sk className="h-10 w-full rounded-full" />
                <Sk className="h-10 w-full rounded-full" />
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
              <Sk className="h-4 w-36 rounded-lg" />
              <div className="flex items-center gap-3">
                <Sk className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1">
                  <Sk className="h-5 w-36 max-w-full rounded-lg" />
                  <Sk className="h-4 w-full rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <FieldSkeleton />
                <FieldSkeleton />
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Sk className="h-4 w-24 rounded-lg" />
                  <Sk className="h-5 w-16 rounded-full" />
                </div>
                <Sk className="h-4 w-full rounded-lg" />
                <div className="flex gap-2">
                  <Sk className="h-8 flex-1 rounded-full" />
                  <Sk className="h-8 flex-1 rounded-full" />
                </div>
              </div>
              <Sk className="h-8 w-full rounded-full" />
            </Card>

            <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-2">
              <Sk className="h-4 w-32 rounded-lg" />
              <Sk className="h-10 w-full rounded-lg" />
              <Sk className="h-8 w-full rounded-full" />
              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                <Sk className="h-10 w-full rounded-lg" />
                <Sk className="h-8 w-full rounded-full" />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
