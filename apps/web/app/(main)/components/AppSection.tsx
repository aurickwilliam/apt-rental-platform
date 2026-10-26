import { Suspense } from "react";
import Image from "next/image";

import { Skeleton } from "@heroui/react";

import AppDownloadAction from "./AppDownloadAction";

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
      {/* The phone is cropped at its bottom edge, so it sits flush with the card and the card clips it. */}
      <Image
        src="/landing/app-mobile-my-rental.png"
        alt="APT mobile app showing the monthly rent, due date and Pay Now button for a rented apartment"
        width={990}
        height={1165}
        sizes="(min-width: 1024px) 416px, (min-width: 640px) 320px, 288px"
        className="mx-auto mt-2 h-auto w-72 self-end sm:w-80 md:mr-12 md:mt-12 lg:mr-16 lg:w-[26rem]"
      />
    </section>
  );
}
