import { Skeleton } from "@heroui/react";

// Loading state for the Add Property flow: mirrors the create shell (back
// row, progress bar) and the Step 1 (Photos & Title) layout so the shimmer
// resolves into the real form instead of a blank page.
export default function CreateApartmentSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading add property form"
      aria-busy="true"
      className="min-h-screen bg-background"
    >
      <div className="max-w-7xl mx-auto py-6 px-6">
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>

      <div className="sticky top-0 z-50 bg-background border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <Skeleton className="size-8 rounded-full shrink-0" />
                {i < 4 && <Skeleton className="h-0.5 flex-1 rounded-none" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-12 rounded-md" />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">
          <div>
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-80 max-w-full rounded-md" />
          </div>

          <div>
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="mt-2 h-11 w-full rounded-lg" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full rounded-md" />
          </div>

          <div>
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="mt-2 h-72 w-full rounded-2xl" />
          </div>

          <div>
            <Skeleton className="h-4 w-36 rounded-md" />
            <div className="mt-2 grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
            <Skeleton className="mt-2 h-3 w-40 rounded-md" />
          </div>

          <div className="flex justify-between mt-10 pt-6 border-t border-border">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
