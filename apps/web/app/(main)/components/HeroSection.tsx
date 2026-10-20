"use client";

import NextImage from "next/image";

import AppDownloadButton from "./AppDownloadButton";
import StartBrowsingBtn from "./StartBrowsingBtn";

import {
  IconBuildingSkyscraper,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";

const STATS = [
  { icon: <IconBuildingSkyscraper size={18} />, value: "2,400+", label: "Active Listings" },
  { icon: <IconUsers size={18} />, value: "800+", label: "Verified Landlords" },
  { icon: <IconShieldCheck size={18} />, value: "100%", label: "Secure Payments" },
];

interface HeroSectionProps {
  /** Rendered only when the APK download URL is configured. */
  apkAvailable?: boolean;
}

export default function HeroSection({ apkAvailable = false }: HeroSectionProps) {
  return (
    // min-h (not h-) + min-w-0: the hero grows when the headline wraps to
    // more lines at narrow widths instead of clipping via overflow-hidden.
    <section className="relative mb-20 flex min-h-[calc(100svh-80px)] w-full min-w-0 flex-row items-center overflow-hidden rounded-2xl">
      {/* Text Side — fluid padding on both axes so short/wide viewports
          don't over-pad and narrow ones don't under-pad. */}
      <div className="relative z-10 flex h-full w-full min-w-0 flex-col justify-center gap-[clamp(1rem,3vh,1.5rem)] p-[clamp(1.25rem,4vw,2rem)] md:w-1/2">
        <div className="flex flex-col gap-3">
          <h1 className="font-nunito font-bold text-brand leading-tight text-[clamp(1.75rem,5vw,3rem)]">
            Find, Rent, and Manage.{" "}
            <span className="text-foreground">All in one place.</span>
          </h1>

          <p className="max-w-md text-base font-medium leading-relaxed text-default-500">
            Discover homes, connect with landlords, and manage rent payments
            with confidence and convenience.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StartBrowsingBtn />
          {apkAvailable ? <AppDownloadButton /> : null}
        </div>

        {/* Stats row — wraps instead of overflowing. Icon tiles, Nunito
            values and muted labels follow the current web card language
            while keeping the original figures. */}
        <div className="mt-2 flex flex-wrap items-start gap-x-[clamp(1rem,3vw,1.5rem)] gap-y-3 border-t border-divider pt-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex min-w-0 items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {stat.icon}
              </span>

              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-nunito text-[clamp(1.125rem,3vw,1.25rem)] font-bold text-primary">
                  {stat.value}
                </span>
                <span className="whitespace-nowrap text-xs font-medium text-default-400">
                  {stat.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Side */}
      <div className="relative hidden w-1/2 min-w-0 self-stretch md:flex">
        <NextImage
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=800&fit=crop&auto=format"
          alt="Hero Image"
          fill
          className="rounded-r-2xl object-cover"
          sizes="50vw"
          priority
        />

        {/* Floating verification badge */}
        <div className="absolute bottom-10 left-8 z-20 flex items-center gap-3 rounded-xl border border-divider bg-background/80 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="flex size-9 items-center justify-center rounded-full bg-success/10 text-success">
            <IconShieldCheck size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              Verified Property
            </span>
            <span className="text-xs text-default-400">
              Background-checked landlord
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
