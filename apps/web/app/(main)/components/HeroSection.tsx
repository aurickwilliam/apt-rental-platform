import { Suspense } from "react";
import Image from "next/image";

import { Skeleton } from "@heroui/react";

import { IconRosetteDiscountCheck } from "@tabler/icons-react";

import AppDownloadAction from "./AppDownloadAction";
import StartBrowsingBtn from "./StartBrowsingBtn";

export default function HeroSection() {
  return (
    <section aria-labelledby="home-title" className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
      <div>
        <h1 id="home-title" className="font-nunito text-4xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
          Find your place<span className="text-brand">.</span>
          <br />
          Feel at home.
        </h1>
        <p className="mt-7 max-w-md text-base leading-7 text-foreground/75">
          Discover apartments, connect with property owners, and manage your rental journey in one place.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
          <StartBrowsingBtn />
          <Suspense fallback={<Skeleton className="h-11 w-full rounded-full bg-skeleton! motion-reduce:after:hidden sm:w-52" />}>
            <AppDownloadAction variant="outline" hideWhenUnavailable />
          </Suspense>
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-foreground/75">
          <IconRosetteDiscountCheck size={16} aria-hidden="true" className="shrink-0 text-secondary-foreground" />
          Verified listings in Caloocan, Malabon, Navotas, and Valenzuela
        </p>
      </div>
      <Image
        src="/landing/hero-living-room.png"
        alt="Bright apartment living room with a cream sofa, wooden coffee table, and large windows"
        width={1824}
        height={1704}
        sizes="(min-width: 1024px) 464px, (min-width: 640px) 928px, calc(100vw - 48px)"
        preload
        className="aspect-[4/3] w-full rounded-2xl object-cover lg:aspect-[76/71]"
      />
    </section>
  );
}
