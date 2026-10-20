"use client";

import NextImage from "next/image";

import AppDownloadButton from "./AppDownloadButton";
import StartBrowsingBtn from "./StartBrowsingBtn";

import {
  IconCreditCard,
  IconFileCheck,
  IconShieldCheck,
} from "@tabler/icons-react";

const TRUST_POINTS = [
  { icon: <IconShieldCheck size={16} />, label: "Verified listings" },
  { icon: <IconFileCheck size={16} />, label: "Digital lease signing" },
  { icon: <IconCreditCard size={16} />, label: "GCash, Maya & QRPh" },
];

interface HeroSectionProps {
  /** Rendered only when the APK download URL is configured. */
  apkAvailable?: boolean;
}

export default function HeroSection({ apkAvailable = false }: HeroSectionProps) {
  return (
    // min-h (not h-) + min-w-0: the hero grows when the headline wraps to
    // more lines at narrow widths instead of clipping via overflow-hidden.
    <section className="relative mb-16 overflow-hidden rounded-3xl border border-divider bg-secondary">
      <div className="grid min-h-[calc(100svh-80px)] lg:grid-cols-2">
        {/* Text Side — fluid padding on both axes so short/wide viewports
            don't over-pad and narrow ones don't under-pad. */}
        <div className="relative z-10 flex min-w-0 flex-col justify-center gap-6 p-6 sm:p-10 lg:p-12">
          <div className="flex flex-col gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
              Camanava rentals, reimagined
            </span>

            <h1 className="font-nunito text-4xl font-bold leading-tight text-brand sm:text-5xl">
              Find, Rent, and Manage.{" "}
              <span className="text-foreground">All in one place.</span>
            </h1>

            <p className="max-w-md text-base leading-relaxed text-muted-foreground">
              Discover verified homes, connect with landlords, and manage rent
              payments — from the browser or the APT Android app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StartBrowsingBtn />
            {apkAvailable ? <AppDownloadButton /> : null}
          </div>

          {/* Capability points — wraps instead of overflowing. */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-divider pt-5">
            {TRUST_POINTS.map((point) => (
              <span
                key={point.label}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
              >
                <span className="text-primary">{point.icon}</span>
                {point.label}
              </span>
            ))}
          </div>
        </div>

        {/* Image Side */}
        <div className="relative hidden min-h-[420px] lg:block">
          {/* Scrim so the photo's left edge melts into the panel instead of
              meeting the copy with a hard seam. */}
          <div className="absolute inset-y-0 left-0 z-10 w-40 bg-gradient-to-r from-secondary to-transparent" />

          <NextImage
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=800&fit=crop&auto=format"
            alt="Hero Image"
            fill
            className="object-cover"
            sizes="50vw"
            priority
          />

          {/* Floating verification badge */}
          <div className="absolute bottom-10 left-8 z-20 flex items-center gap-3 rounded-xl border border-divider bg-background/80 px-4 py-3 shadow-lg backdrop-blur-md">
            <div className="flex size-9 items-center justify-center rounded-full bg-success/10 text-success">
              <IconShieldCheck size={18} />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">
                Verified Property
              </span>
              <span className="text-default-400 text-xs">
                Background-checked landlord
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
