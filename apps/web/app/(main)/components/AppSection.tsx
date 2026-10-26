import { Suspense } from "react";

import { Skeleton } from "@heroui/react";

import AppDownloadAction from "./AppDownloadAction";
import MobileAppPreview from "./MobileAppPreview";

export default function AppSection() {
  return (
    <section aria-labelledby="mobile-title" className="mb-16 grid items-center gap-10 rounded-2xl bg-secondary p-6 sm:mb-24 sm:p-10 md:grid-cols-[1fr_auto] md:gap-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">APT Mobile</p>
        <h2 id="mobile-title" className="mt-5 font-nunito text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          A simpler way to stay connected.
        </h2>
        <p className="mt-5 max-w-md text-base leading-7 text-foreground/75">
          Your rental conversations, records, and important updates can stay within reach while you are on the go.
        </p>
        <div className="mt-10">
          <Suspense fallback={<Skeleton className="h-11 w-52 rounded-full bg-skeleton! motion-reduce:after:hidden" />}>
            <AppDownloadAction />
          </Suspense>
        </div>
        <p className="mt-4 text-xs leading-5 text-foreground/75">Continue using APT on the web today.</p>
      </div>
      <MobileAppPreview />
    </section>
  );
}
