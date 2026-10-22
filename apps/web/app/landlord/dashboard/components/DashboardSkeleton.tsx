"use client";

import { Skeleton } from "@heroui/react";

import DashboardHeader from "./DashboardHeader";

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

export default function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6" aria-busy="true" aria-label="Loading dashboard">
      <DashboardHeader />

      <div aria-hidden="true">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex min-h-40 flex-col justify-between gap-6 rounded-xl bg-primary p-5">
            <div className="space-y-2">
              <Sk className="h-4 w-40 max-w-full rounded-lg" />
              <Sk className="h-10 w-48 max-w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Sk className="h-2 w-full rounded-full" />
              <Sk className="h-4 w-44 max-w-full rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3">
                  <Sk className="size-7.5 shrink-0 rounded-md" />
                  <Sk className="h-6 w-32 max-w-full rounded-lg" />
                </div>
                <Sk className="h-9 w-24 max-w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
            <h3 className="mb-4 text-base font-medium text-foreground">Monthly Revenue</h3>
            <div className="flex h-[220px] items-end gap-3 pb-6 pt-4">
              {["h-1/3", "h-1/2", "h-2/3", "h-1/2", "h-3/4", "h-2/3", "h-full"].map((height, index) => (
                <Sk key={index} className={`min-w-0 flex-1 rounded-lg ${height}`} />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-medium text-foreground">Upcoming rent due</h3>
              <Sk className="h-7 w-20 rounded-full" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Sk className="h-4 w-32 max-w-full rounded-lg" />
                    <Sk className="h-3 w-40 max-w-full rounded-lg" />
                  </div>
                  <Sk className="h-4 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
