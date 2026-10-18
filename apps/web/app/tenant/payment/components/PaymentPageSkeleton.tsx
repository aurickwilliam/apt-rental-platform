"use client";

import { Skeleton } from "@heroui/react";

import { PaymentPageHeader, PaymentPageShell } from "./PaymentPageLayout";

// Loading state that mirrors the payment page card for card, so nothing moves
// when the data arrives. Same `bg-grey-300!` shimmer as the other page
// skeletons (see PaymentHistorySkeleton / PassportSkeleton).
const CARD = "rounded-2xl border border-border bg-card shadow-none";

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function SummaryRowSkeleton({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Sk className={`h-4 ${label} rounded-lg`} />
      <Sk className={`h-4 ${value} rounded-lg`} />
    </div>
  );
}

function LeaseTileSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <Sk className="h-3 w-20 rounded-lg" />
      <Sk className="mt-2 h-5 w-28 max-w-full rounded-lg" />
    </div>
  );
}

function MethodRowSkeleton() {
  return (
    <div className="flex min-h-16 items-center gap-3 p-3">
      <Sk className="size-5 shrink-0 rounded-full" />
      <Sk className="h-8 w-20 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Sk className="h-4 w-28 max-w-full rounded-lg" />
        <Sk className="h-3 w-40 max-w-full rounded-lg" />
      </div>
    </div>
  );
}

function MethodPanelHeaderSkeleton() {
  return (
    <div className="mb-3 flex items-start gap-2">
      <Sk className="size-9 shrink-0 rounded-lg" />
      <div className="space-y-1.5">
        <Sk className="h-4 w-32 rounded-lg" />
        <Sk className="h-3 w-52 max-w-full rounded-lg" />
      </div>
    </div>
  );
}

function PreferredPanelSkeleton() {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
      <MethodPanelHeaderSkeleton />
      <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-primary/20 bg-card">
        <MethodRowSkeleton />
        <MethodRowSkeleton />
      </div>
    </div>
  );
}

function OtherPanelSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <MethodPanelHeaderSkeleton />
      <div className="grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <MethodRowSkeleton />
        <MethodRowSkeleton />
        <MethodRowSkeleton />
      </div>
    </div>
  );
}

export default function PaymentPageSkeleton() {
  return (
    <PaymentPageShell>
      <div className="space-y-4" aria-busy="true" aria-label="Loading payment">
        <PaymentPageHeader />

        {/* Main grid — row 1 top cards share equal height via items-stretch */}
        <div className="grid gap-4 lg:grid-cols-3 items-stretch">
          {/* Row 1, left: lease details */}
          <div className="lg:col-span-2 h-full">
            <div className={`h-full p-4 ${CARD}`}>
              <div className="grid gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
                <Sk className="h-44 w-full rounded-xl lg:h-full" />

                <div className="min-w-0">
                  <div className="border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Sk className="size-5 shrink-0 rounded-md" />
                      <Sk className="h-6 w-56 max-w-full rounded-lg" />
                    </div>
                    <div className="mt-1 flex items-start gap-1.5">
                      <Sk className="mt-0.5 size-4 shrink-0 rounded-md" />
                      <Sk className="h-4 w-64 max-w-full rounded-lg" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Sk className="size-10 shrink-0 rounded-full" />
                    <div className="min-w-0 space-y-1.5">
                      <Sk className="h-3 w-16 rounded-lg" />
                      <Sk className="h-5 w-32 max-w-full rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <LeaseTileSkeleton />
                <LeaseTileSkeleton />
                <LeaseTileSkeleton />
              </div>
            </div>
          </div>

          {/* Row 1, right: payment summary */}
          <div className="h-full">
            <div className={`flex h-full flex-col ${CARD}`}>
              <div className="px-4 pt-4 pb-3">
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <Sk className="h-6 w-40 rounded-lg" />
                  <Sk className="h-6 w-44 rounded-full" />
                </div>
              </div>
              <div className="flex flex-1 flex-col space-y-3 px-4 pb-4">
                <SummaryRowSkeleton label="w-24" value="w-20" />
                <SummaryRowSkeleton label="w-20" value="w-28" />
                <SummaryRowSkeleton label="w-24" value="w-20" />
                <div className="my-1 h-px bg-border" />
                <Sk className="mt-auto h-14 w-full rounded-xl" />
              </div>
            </div>
          </div>

          {/* Row 2: payment method (full width) */}
          <div className="lg:col-span-3 space-y-4">
            <section>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1.5">
                  <Sk className="h-5 w-48 rounded-lg" />
                  <Sk className="h-4 w-72 max-w-full rounded-lg" />
                </div>
                <Sk className="h-8 w-40 shrink-0 rounded-full" />
              </div>
              <div className={`p-4 ${CARD}`}>
                <div className="grid gap-3 lg:grid-cols-2">
                  <PreferredPanelSkeleton />
                  <OtherPanelSkeleton />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Pay footer — in-flow sticky (never overlays inputs, mobile footer parity) */}
        <div className="sticky bottom-4 z-20 mt-4">
          <div className="flex flex-row items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800/80 dark:bg-zinc-900">
            <div className="min-w-0 space-y-1.5">
              <Sk className="h-3 w-24 rounded-lg" />
              <Sk className="h-6 w-32 max-w-full rounded-lg" />
            </div>
            <Sk className="h-10 flex-1 rounded-full sm:w-44 sm:flex-none" />
          </div>
        </div>
      </div>
    </PaymentPageShell>
  );
}
