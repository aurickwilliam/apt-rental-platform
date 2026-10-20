import { Skeleton } from "@heroui/react";

// Darker-than-default block base so the shimmer sweep reads clearly.
// The `!` is intentional: @heroui/styles ships unlayered CSS, which
// beats layered Tailwind utilities without it (same as the Alert fix).
function Sk({ className = "" }: { className?: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

// Content-shaped loading state for the landing route, mirroring the
// geometry of page.tsx (hero, Why Us, featured carousel, How It Works and
// the app section) so the skeleton → content transition doesn't shift layout.
export default function MainLoading() {

  return (
    <div
      className="min-h-screen"
      aria-busy="true"
      aria-label="Loading"
    >
      <main className="mx-auto flex max-w-7xl flex-col px-4 pt-4">
        {/* Hero */}
        <div className="relative mb-20 flex min-h-[calc(100svh-80px)] w-full min-w-0 flex-row items-center overflow-hidden rounded-2xl">
          <div className="flex h-full w-full min-w-0 flex-col justify-center gap-6 p-5 md:w-1/2 md:p-8">
            <div className="flex flex-col gap-3">
              <Sk className="h-10 w-3/4 rounded-xl" />
              <Sk className="h-10 w-1/2 rounded-xl" />
              <Sk className="mt-3 h-4 w-full max-w-md rounded-full" />
              <Sk className="h-4 w-2/3 max-w-md rounded-full" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Sk className="h-12 w-40 rounded-xl" />
              <Sk className="h-12 w-52 rounded-xl" />
            </div>

            <div className="mt-2 flex flex-wrap items-start gap-6 border-t border-divider pt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <Sk className="size-9 rounded-lg" />
                  <div className="flex flex-col gap-1">
                    <Sk className="h-5 w-16 rounded-md" />
                    <Sk className="h-3 w-24 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden w-1/2 min-w-0 self-stretch md:block">
            <Sk className="h-full w-full rounded-r-2xl" />
          </div>
        </div>

        {/* Why Us */}
        <section className="mt-10 md:mt-16 flex flex-col items-center">
          <Sk className="h-3 w-20 rounded-full" />
          <Sk className="h-8 w-56 rounded-xl mt-3" />
          <Sk className="h-4 w-80 max-w-full rounded-full mt-4" />
          <div className="grid gap-5 md:grid-cols-3 mt-8 md:mt-12 w-full">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-4 rounded-2xl border border-divider p-8">
                <Sk className="size-12 rounded-xl" />
                <Sk className="h-6 w-40 rounded-lg" />
                <Sk className="h-4 w-full rounded-full" />
                <Sk className="h-4 w-full rounded-full" />
                <Sk className="h-4 w-2/3 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Featured apartments */}
        <section className="mt-14 md:mt-16">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
              <Sk className="h-8 w-64 rounded-xl" />
              <Sk className="h-4 w-56 rounded-full" />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Sk className="size-10 rounded-full" />
              <Sk className="size-10 rounded-full" />
            </div>
          </div>

          <div className="flex gap-4 mt-6 pb-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-44 sm:w-56 shrink-0 flex flex-col gap-3">
                <Sk className="h-44 w-full rounded-xl" />
                <Sk className="h-5 w-3/4 rounded-lg" />
                <Sk className="h-4 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="mt-14 md:mt-20 flex flex-col items-center">
          <Sk className="h-3 w-24 rounded-full" />
          <Sk className="h-8 w-56 rounded-xl mt-3" />
          <Sk className="h-4 w-80 max-w-full rounded-full mt-4" />
          <div className="flex flex-col md:flex-row gap-5 mt-8 md:mt-12 w-full">
            <Sk className="w-full md:w-1/2 h-96 rounded-2xl" />
            <div className="flex flex-col gap-5 md:w-1/2">
              <Sk className="w-full h-44 rounded-2xl" />
              <Sk className="w-full h-44 rounded-2xl" />
            </div>
          </div>
        </section>

        {/* App download */}
        <section className="mt-16 mb-16 md:mt-24">
          <div className="rounded-3xl border border-divider bg-secondary p-8 md:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="flex flex-col gap-5">
                <Sk className="h-3 w-24 rounded-full" />
                <Sk className="h-9 w-3/4 rounded-xl" />
                <Sk className="h-4 w-full rounded-full" />
                <Sk className="h-4 w-2/3 rounded-full" />
                <Sk className="h-4 w-5/6 rounded-full" />
                <Sk className="mt-2 h-12 w-52 rounded-xl" />
              </div>
              <Sk className="mx-auto h-96 w-full max-w-[260px] rounded-[2.5rem]" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
