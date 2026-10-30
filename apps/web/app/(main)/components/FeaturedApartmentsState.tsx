import { Skeleton } from "@heroui/react";
import design from "./landing-design.module.css";

interface FeaturedApartmentsStateProps {
  state: "loading" | "empty" | "error";
}

export default function FeaturedApartmentsState({ state }: FeaturedApartmentsStateProps) {
  const loading = state === "loading";

  return (
    <div className="mt-10" data-featured-state={state} aria-busy={loading}>
      <div className={`flex items-center justify-between gap-4 ${design.featuredHeader}`}>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className={`font-nunito ${design.listingTitle}`}>Apartments Tenants Love</h2>
          <p className="text-base text-muted-foreground">Verified homes our tenants rate highest.</p>
        </div>
        {loading ? (
          <div aria-hidden="true" className="flex shrink-0 gap-2">
            {[0, 1].map(index => <Skeleton key={index} className="size-9 rounded-full bg-skeleton! motion-reduce:after:hidden" />)}
          </div>
        ) : null}
      </div>
      {loading ? (
        <>
          <p role="status" className="sr-only">Loading featured apartments…</p>
          <div aria-hidden="true" className="overflow-hidden">
            <div className="-ml-4 mt-4 flex pb-4">
              {[0, 1, 2, 3, 4, 5].map(index => (
                <div key={index} className="w-44 shrink-0 pl-4 sm:w-56">
                  <div className="overflow-hidden rounded-xl border border-transparent bg-surface">
                    <Skeleton className="aspect-square w-full rounded-xl bg-skeleton! motion-reduce:after:hidden" />
                    {/* Reserve the real card's details/footer height, not fake listing content. */}
                    <div className="flex h-[105px] flex-col gap-2 p-2">
                      <Skeleton className="h-4 w-3/4 rounded-full bg-skeleton! motion-reduce:after:hidden" />
                      <Skeleton className="h-3 w-1/2 rounded-full bg-skeleton! motion-reduce:after:hidden" />
                      <Skeleton className="mt-auto h-4 w-2/3 rounded-full bg-skeleton! motion-reduce:after:hidden" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p role={state === "error" ? "alert" : "status"} className="mt-4 min-h-[265px] py-8 text-muted-foreground sm:min-h-[313px]">
          {state === "error"
            ? "We couldn’t load featured apartments. Please refresh the page to try again."
            : "No verified apartments are available right now. Please check back soon."}
        </p>
      )}
    </div>
  );
}
