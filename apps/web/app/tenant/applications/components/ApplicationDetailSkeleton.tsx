"use client";

import { Skeleton } from "@heroui/react";

// Loading state that mirrors the application detail page structure
// class-for-class, so every placeholder sits exactly where its content
// will land when the data arrives.
function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
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
      className="w-full min-w-0 px-4 py-6 sm:py-8 space-y-5"
      aria-busy="true"
      aria-label="Loading application details"
    >
      <Sk className="h-8 w-20 rounded-full" />

      <div className="min-w-0 space-y-2">
        <Sk className="h-4 w-24 max-w-full rounded-lg" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Sk className="h-8 w-full max-w-64 rounded-lg" />
          <Sk className="h-8 w-28 max-w-full shrink-0 rounded-full" />
          <Sk className="h-4 w-36 max-w-full rounded-lg" />
        </div>
        <Sk className="h-4 w-full max-w-52 rounded-lg" />
      </div>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="relative aspect-[16/10] w-full bg-muted">
              <Sk className="h-full w-full rounded-none" />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-none sm:p-5">
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[minmax(0,1fr)_auto]">
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
              <Sk className="h-11 flex-1 rounded-full" />
              <Sk className="h-11 flex-1 rounded-full" />
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-none">
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
            <Sk className="h-11 w-44 max-w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
