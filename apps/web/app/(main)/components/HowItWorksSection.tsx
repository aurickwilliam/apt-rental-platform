import { Surface } from "@heroui/react";

import DiscoverNowBtn from "./DiscoverNowBtn";

import {
  IconCashBanknote as BanknoteArrowUp,
  IconCircleCheck,
  IconFileCheck as FileCheckCorner,
  IconMap as Map,
} from "@tabler/icons-react";

const DISCOVER_POINTS = [
  "Verified Listings",
  "Intelligent Filters",
  "Lifestyle Preferences",
  "AI Assist Search",
];

export default function HowItWorksSection() {
  return (
    <section className="mb-10 mt-14 md:mt-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          The process
        </span>

        <h2 className="font-nunito text-3xl font-bold text-brand md:text-5xl">
          How it Works?
        </h2>

        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          A stress-free way to navigate the rental market with verified listings
          and secure digital tools.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-5 md:mt-12 md:flex-row">
        {/* Discover */}
        <Surface className="flex w-full flex-col gap-4 rounded-2xl border border-divider bg-surface p-8 md:w-1/2">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Map size={26} />
          </div>

          <h3 className="font-nunito text-2xl font-semibold text-brand">
            Discover
          </h3>

          <p className="text-sm leading-relaxed text-muted-foreground">
            Explore a wide range of verified listings and use intelligent filters
            to narrow down your options based on location, budget, amenities, and
            lifestyle preferences. Finding the right home becomes faster, easier,
            and stress-free.
          </p>

          <div className="mt-1 flex flex-col gap-2.5">
            {DISCOVER_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-2">
                <IconCircleCheck size={18} className="text-primary" />
                <p className="text-sm font-medium">{point}</p>
              </div>
            ))}
          </div>

          <div className="mt-2">
            <DiscoverNowBtn />
          </div>
        </Surface>

        {/* Apply & Pay */}
        <div className="flex flex-col gap-5 md:w-1/2">
          <Surface className="flex w-full flex-col gap-4 rounded-2xl border border-divider bg-surface p-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileCheckCorner size={26} />
            </div>

            <h3 className="font-nunito text-2xl font-semibold text-brand">
              Apply &amp; Sign
            </h3>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Complete your rental application entirely online and upload
              required documents with ease. Review agreements clearly and sign
              securely using digital e-signing, eliminating paperwork and
              unnecessary delays.
            </p>
          </Surface>

          <Surface className="flex w-full flex-col gap-4 rounded-2xl border border-divider bg-surface p-8">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BanknoteArrowUp size={26} />
            </div>

            <h3 className="font-nunito text-2xl font-semibold text-brand">
              Live &amp; Pay
            </h3>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Settle into your new home with full control at your fingertips.
              Manage rent payments, track records, receive updates, and
              communicate with owners or management, all conveniently from your
              mobile device.
            </p>
          </Surface>
        </div>
      </div>
    </section>
  );
}
