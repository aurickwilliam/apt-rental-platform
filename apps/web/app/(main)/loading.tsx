import { Skeleton } from "@heroui/react";

// Content-shaped loading state for the landing route, mirroring the
// geometry of page.tsx (hero, Why Us, featured carousel, How It Works)
// so the skeleton → content transition doesn't shift layout.
export default function MainLoading() {
  return (
    <div
      className="min-h-screen"
      aria-busy="true"
      aria-label="Loading"
    >
      <main className="max-w-7xl mx-auto px-4 pt-4 flex flex-col">
        {/* Hero */}
        <div className="relative w-full h-[calc(100svh-80px)] flex flex-row items-center rounded-2xl mb-20 overflow-hidden">
          <div className="h-full flex flex-col justify-center gap-6 p-8 w-full md:w-1/2">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-3/4 rounded-xl" />
              <Skeleton className="h-10 w-1/2 rounded-xl" />
              <Skeleton className="h-4 w-full max-w-md rounded-full mt-2" />
              <Skeleton className="h-4 w-2/3 max-w-md rounded-full" />
            </div>
            <Skeleton className="h-12 w-44 rounded-xl" />
            <div className="flex flex-row gap-6 pt-2 mt-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-20 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="hidden md:flex w-1/2 self-stretch">
            <Skeleton className="h-full w-full rounded-r-2xl" />
          </div>
        </div>

        {/* Why Us */}
        <section className="mt-10 md:mt-20 flex flex-col items-center">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 max-w-full rounded-full mt-4" />
          <div className="flex flex-col gap-5 md:flex-row mt-10 md:mt-20 w-full">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-3 w-full">
                <Skeleton className="size-12 rounded-xl" />
                <Skeleton className="h-6 w-40 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Featured apartments */}
        <section className="mt-10 md:mt-20">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="size-10 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-5 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mt-10 md:mt-10 mb-10 flex flex-col md:flex-row gap-5">
          <Skeleton className="w-full md:w-1/2 h-72 rounded-2xl" />
          <div className="flex flex-col gap-5 md:w-1/2">
            <Skeleton className="w-full h-32 rounded-2xl" />
            <Skeleton className="w-full h-32 rounded-2xl" />
          </div>
        </section>
      </main>
    </div>
  );
}
