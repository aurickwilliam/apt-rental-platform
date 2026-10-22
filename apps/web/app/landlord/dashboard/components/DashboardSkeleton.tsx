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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className={`p-4 flex flex-col gap-3 rounded-xl ${
                index === 0 ? "bg-primary" : "bg-card border border-border"
              }`}
            >
              <div className="flex gap-3 items-center">
                <Sk className="size-7.5 shrink-0 rounded-md" />
                <div className="min-w-0">
                  <Sk className="h-6 w-32 max-w-full rounded-lg" />
                  {index === 1 ? <Sk className="h-4 w-20 rounded-lg" /> : null}
                </div>
              </div>
              <Sk className="h-9 w-28 max-w-full rounded-lg" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
            <h3 className="text-base font-medium mb-4 text-foreground">Monthly Revenue</h3>
            <div className="flex h-[220px] items-end gap-3 pb-6 pt-4">
              {["h-1/3", "h-1/2", "h-2/3", "h-1/2", "h-3/4", "h-2/3", "h-full"].map((height, index) => (
                <Sk key={index} className={`min-w-0 flex-1 rounded-lg ${height}`} />
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-base font-medium mb-4 text-foreground">Rent Collection</h3>
            <div className="flex h-[220px] flex-col items-center justify-center gap-4">
              <div className="relative">
                <Sk className="size-40 rounded-full" />
                <div className="absolute inset-6 rounded-full bg-card" />
              </div>
              <Sk className="h-4 w-40 max-w-full rounded-lg" />
            </div>
          </div>

          <div className="lg:col-span-3 bg-card border border-border rounded-xl p-4">
            <h3 className="text-base font-medium mb-4 text-foreground">Occupancy Rate</h3>
            <div className="flex flex-col items-center justify-center gap-2 py-16">
              <Sk className="size-20 rounded-full" />
              <Sk className="h-7 w-56 max-w-full rounded-lg" />
              <Sk className="h-5 w-80 max-w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
