import { Skeleton } from "@heroui/react";

function Sk({ className = "" }: { className?: string }) {
  return <Skeleton className={`bg-skeleton! motion-reduce:after:hidden ${className}`} />;
}

// The public group keeps its existing loading boundary; no route changes.
export default function MainLoading() {
  return (
    <div className="min-h-screen" aria-busy="true" aria-label="Loading">
      <p role="status" className="sr-only">Loading APT…</p>
      <div aria-hidden="true" className="mx-auto max-w-5xl px-6">
        <div className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div>
            <Sk className="h-10 w-full max-w-sm rounded-xl sm:h-14" />
            <Sk className="mt-2 h-10 w-3/4 rounded-xl sm:h-14" />
            <Sk className="mt-7 h-4 w-full rounded-full" />
            <Sk className="mt-3 h-4 w-3/4 rounded-full" />
            <Sk className="mt-8 h-11 w-44 rounded-full sm:mt-10" />
          </div>
          <Sk className="aspect-[4/3] w-full rounded-2xl lg:aspect-[76/71]" />
        </div>

        <div className="pb-8 pt-10 sm:pb-12">
          <Sk className="h-8 w-64 max-w-full rounded-xl" />
          <Sk className="mt-3 h-4 w-56 max-w-full rounded-full" />
          <div className="mt-4 flex gap-4 overflow-hidden pb-4">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="w-44 shrink-0 sm:w-56">
                <Sk className="aspect-square w-full rounded-xl" />
                <Sk className="mt-3 h-4 w-3/4 rounded-full" />
                <Sk className="mt-2 h-4 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="py-16 sm:py-24">
          <Sk className="mx-auto h-9 w-80 max-w-full rounded-xl" />
          <Sk className="mx-auto mt-4 h-4 w-full max-w-2xl rounded-full" />
          <div className="mt-12 space-y-16 sm:mt-16 lg:space-y-32">
            {[false, true].map(reversed => (
              <div key={String(reversed)} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                <div className={reversed ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-2 lg:row-start-1"}>
                  <Sk className="h-3 w-32 rounded-full" />
                  <Sk className="mt-6 h-9 w-full rounded-xl" />
                  {[0, 1].map(index => (
                    <div key={index} className="mt-7 space-y-3">
                      <Sk className="h-4 w-full rounded-full" />
                      <Sk className="h-4 w-4/5 rounded-full" />
                    </div>
                  ))}
                </div>
                <Sk className={`aspect-[10/9] w-full rounded-2xl ${reversed ? "lg:col-start-2 lg:row-start-1" : "lg:col-start-1 lg:row-start-1"}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="py-8 sm:py-12">
          <Sk className="h-3 w-28 rounded-full" />
          <Sk className="mt-4 h-9 w-96 max-w-full rounded-xl" />
          <Sk className="mt-3 h-4 w-80 max-w-full rounded-full" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[0, 1, 2].map(index => <Sk key={index} className="h-52 rounded-2xl" />)}
          </div>
        </div>
        <Sk className="my-12 h-60 rounded-2xl sm:my-16 md:h-48" />
        <Sk className="mb-16 h-[38rem] rounded-2xl sm:mb-24 md:h-80" />
      </div>
    </div>
  );
}
