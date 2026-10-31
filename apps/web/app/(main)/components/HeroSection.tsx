import { Suspense } from "react";
import Image from "next/image";

import { Skeleton } from "@heroui/react";

import { IconRosetteDiscountCheck } from "@tabler/icons-react";

import AppDownloadAction from "./AppDownloadAction";
import StartBrowsingBtn from "./StartBrowsingBtn";
import LandingReveal from "./LandingReveal";
import design from "./landing-design.module.css";

export default function HeroSection() {
  return (
    <section aria-labelledby="home-title" className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
      <div>
        <LandingReveal name="hero-headline" distance={16} duration={0.6}>
          <h1 id="home-title" className={`font-nunito text-foreground ${design.heroTitle}`}>
            Find your place<span className="text-brand">.</span>
            <br />
            Feel at home.
          </h1>
        </LandingReveal>
        <LandingReveal name="hero-description" delay={0.08} distance={16} duration={0.6} className="mt-6">
          <p className={`text-lg text-foreground/75 ${design.heroDescription}`}>
            Discover apartments, connect with property owners, and manage your rental journey in one place.
          </p>
        </LandingReveal>
        <LandingReveal name="hero-actions" delay={0.16} distance={12} duration={0.6} className="mt-8 sm:mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <StartBrowsingBtn />
            <Suspense fallback={<Skeleton className="h-11 w-full rounded-full bg-skeleton! motion-reduce:after:hidden sm:w-52" />}>
              <AppDownloadAction variant="outline" hideWhenUnavailable />
            </Suspense>
          </div>
        </LandingReveal>
        <LandingReveal name="hero-trust" delay={0.2} distance={12} duration={0.6} className="mt-5">
          <p className="flex items-center gap-2 text-sm leading-6 text-foreground/75">
            <IconRosetteDiscountCheck size={16} aria-hidden="true" className="shrink-0 text-secondary-foreground" />
            Verified listings in Caloocan, Malabon, Navotas, and Valenzuela
          </p>
        </LandingReveal>
      </div>
      <LandingReveal name="hero-image" delay={0.24} duration={0.72} distance={0} scaleFrom={0.985}>
        <Image
          src="/landing/hero-living-room.png"
          alt="Bright apartment living room with a cream sofa, wooden coffee table, and large windows"
          width={1824}
          height={1704}
          sizes="(min-width: 1280px) 592px, (min-width: 1024px) calc(50vw - 48px), calc(100vw - 48px)"
          preload
          className="aspect-[4/3] w-full rounded-2xl object-cover lg:aspect-[76/71]"
        />
      </LandingReveal>
    </section>
  );
}
