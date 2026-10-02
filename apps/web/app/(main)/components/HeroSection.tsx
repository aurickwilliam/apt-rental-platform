"use client";

import NextImage from "next/image";
import StartBrowsingBtn from "./StartBrowsingBtn";
import { IconShieldCheck, IconBuildingSkyscraper, IconUsers } from "@tabler/icons-react";

const STATS = [
  { icon: <IconBuildingSkyscraper size={18} />, value: "2,400+", label: "Active Listings" },
  { icon: <IconUsers size={18} />, value: "800+", label: "Verified Landlords" },
  { icon: <IconShieldCheck size={18} />, label: "Secure Payments", value: "100%" },
];

export default function HeroSection() {
  return (
    // min-h (not h-) + min-w-0: the hero grows when the headline wraps to
    // more lines at narrow widths instead of clipping via overflow-hidden.
    <section className="relative flex min-h-[calc(100svh-80px)] w-full min-w-0 flex-row items-center overflow-hidden rounded-2xl mb-20">
      <div className="absolute inset-0 w-1/2 pointer-events-none z-0" />

      {/* Text Side — fluid padding on both axes so short/wide viewports
          don't over-pad and narrow ones don't under-pad. */}
      <div className="relative z-10 flex h-full w-full min-w-0 flex-col justify-center gap-[clamp(1rem,3vh,1.5rem)] p-[clamp(1.25rem,4vw,2rem)] md:w-1/2">
        <div className="flex flex-col gap-3">
          <h1 className="font-inter font-semibold text-primary leading-tight text-[clamp(1.75rem,5vw,3rem)]">
            Find, Rent, and Manage.{" "}
            <span className="text-foreground">All in one place.</span>
          </h1>

          <p className="text-base text-default-500 font-medium max-w-md leading-relaxed">
            Discover homes, connect with landlords, and manage
            rent payments with confidence and convenience.
          </p>
        </div>

        <StartBrowsingBtn />

        {/* Stats row — wraps instead of overflowing. Each stat is allowed
            to shrink to its content width; the nowrap label stays intact
            because the row itself reflows. */}
        <div className="mt-2 flex flex-wrap items-start gap-x-[clamp(1rem,3vw,1.5rem)] gap-y-3 border-t border-divider pt-2">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex min-w-0 flex-col gap-0.5">
              <span className="font-inter font-semibold text-primary text-[clamp(1.125rem,3vw,1.25rem)]">
                {stat.value}
              </span>
              <span className="text-xs text-default-400 font-medium whitespace-nowrap">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Image Side */}
      <div className="relative self-stretch hidden md:flex w-1/2 min-w-0">
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" />

        <NextImage
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=800&fit=crop&auto=format"
          alt="Hero Image"
          fill
          className="object-cover rounded-r-2xl"
          sizes="50vw"
        />

        {/* Floating verification badge */}
        <div className="absolute bottom-10 left-8 z-20 flex items-center gap-3 rounded-xl border border-divider bg-background/80 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="flex size-9 items-center justify-center rounded-full bg-success/10 text-success">
            <IconShieldCheck size={18} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm">Verified Property</span>
            <span className="text-default-400 text-xs">Background-checked landlord</span>
          </div>
        </div>
      </div>

    </section>
  );
}