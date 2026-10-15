"use client";

import { Skeleton } from "@heroui/react";

// Loading state that mirrors the application detail page structure
// class-for-class, so every placeholder sits exactly where its content
// will land when the data arrives.
function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function SectionRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
      <Sk className="h-5 w-full max-w-44 rounded-lg" />
      <Sk className="size-4 shrink-0 rounded-md" />
    </div>
  );
}

export default function ApplicationDetailSkeleton() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 py-8 space-y-6"
      aria-busy="true"
      aria-label="Loading application details"
    >
      <Sk className="h-8 w-20 rounded-full" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Sk className="h-4 w-24 max-w-full rounded-lg" />
          <Sk className="h-8 w-full max-w-64 rounded-lg" />
          <Sk className="h-4 w-full max-w-52 rounded-lg" />
        </div>
        <Sk className="h-8 w-28 max-w-full shrink-0 rounded-full" />
      </div>

      <div className="grid items-start gap-6 xl:items-stretch xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="relative h-64 md:h-[360px]">
              <Sk className="h-full w-full rounded-none" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-none">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0 space-y-2">
                <Sk className="h-3 w-16 rounded-lg" />
                <Sk className="h-4 w-full rounded-lg" />
              </div>
              <div className="min-w-0 space-y-2">
                <Sk className="h-3 w-24 max-w-full rounded-lg" />
                <Sk className="h-6 w-full max-w-32 rounded-lg" />
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Sk className="h-9 flex-1 rounded-full" />
              <Sk className="h-9 flex-1 rounded-full" />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4 xl:flex xl:flex-col">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-none xl:flex xl:h-full xl:flex-col">
            <div className="space-y-2">
              <Sk className="h-6 w-full max-w-48 rounded-lg" />
              <Sk className="h-4 w-full max-w-md rounded-lg" />
            </div>
            <div className="flex flex-col gap-3">
              <SectionRowSkeleton />
              <SectionRowSkeleton />
              <SectionRowSkeleton />
              <SectionRowSkeleton />
            </div>
            <Sk className="h-10 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
