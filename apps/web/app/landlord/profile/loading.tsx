import { Skeleton } from "@heroui/react";

// Loading state that mirrors the real profile layout card for card, so
// nothing moves when the data arrives (see PassportSkeleton for the
// shared pattern).

const CARD = "w-full max-w-7xl mx-auto px-4 py-8 space-y-4";

// Darker-than-default base so the shimmer reads clearly; the `!` beats
// @heroui/styles' unlayered CSS.
function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function ProfileLoadingSkeleton() {
  return (
    <div className={CARD} aria-hidden="true">
      {/* Header: avatar, name, chips, email */}
      <div className="border border-border bg-card p-6 rounded-2xl">
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <Sk className="size-36 rounded-full shrink-0" />
          <div className="flex flex-col items-center gap-1.5 min-w-0 sm:items-start">
            <Sk className="h-8 w-48 rounded-lg" />
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <Sk className="h-6 w-20 rounded-full" />
              <Sk className="h-6 w-24 rounded-full" />
            </div>
            <Sk className="h-4 w-56 max-w-full rounded" />
          </div>
        </div>
      </div>

      {/* Verification timeline card */}
      <div className="border border-border bg-card p-6 rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Sk className="h-6 w-40 rounded-lg" />
            <Sk className="h-4 w-28 rounded-lg" />
          </div>
          <Sk className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* Profile form card */}
      <div className="border border-border bg-card p-6 rounded-2xl">
        <Sk className="h-6 w-40 rounded-lg mb-4" />
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Sk className="h-3 w-24 rounded" />
              <Sk className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandlordProfileLoading() {
  return <ProfileLoadingSkeleton />;
}
