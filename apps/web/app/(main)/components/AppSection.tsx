import { Suspense } from "react";

import { Skeleton } from "@heroui/react";

import AppDownloadAction from "./AppDownloadAction";
import LandingMobileDemo from "./mobile-demo/LandingMobileDemo";
import { demoInter, demoNunito } from "./mobile-demo/demo-fonts";

export default function AppSection() {
  return (
    <section aria-labelledby="mobile-title" className="mb-16 grid overflow-hidden rounded-2xl bg-secondary sm:mb-24 md:grid-cols-[1fr_auto]">
      <div className="p-6 sm:p-10 md:self-center md:py-14 lg:pl-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">APT Mobile</p>
        <h2 id="mobile-title" className="mt-5 font-nunito text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          A simpler way to stay connected.
        </h2>
        <p className="mt-5 max-w-lg text-lg leading-8 text-foreground/75">
          Your rental conversations, records, and important updates can stay within reach while you are on the go.
        </p>
        <div className="mt-10">
          <Suspense fallback={<Skeleton className="h-11 w-52 rounded-full bg-skeleton! motion-reduce:after:hidden" />}>
            <AppDownloadAction />
          </Suspense>
        </div>
      </div>
      <LandingMobileDemo fontClassName={`${demoInter.variable} ${demoNunito.variable}`} />
    </section>
  );
}
