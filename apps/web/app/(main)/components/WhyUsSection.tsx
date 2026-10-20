import { Surface } from "@heroui/react";

import {
  IconBuilding as Building2,
  IconClipboardCheck as ClipboardCheck,
  IconKey as KeyRound,
} from "@tabler/icons-react";

const REASONS = [
  {
    icon: <KeyRound size={26} />,
    title: "For Tenants",
    body: "Find a place that truly feels like home. We make renting simple with verified listings, transparent pricing, and responsive support, so you can move in with confidence and peace of mind.",
  },
  {
    icon: <Building2 size={26} />,
    title: "For Owners",
    body: "Maximize your property's value without the hassle. From tenant screening to rent collection, we help you manage your rentals efficiently while keeping your investment secure.",
  },
  {
    icon: <ClipboardCheck size={26} />,
    title: "For Management",
    body: "Streamline operations and stay in control. Our platform centralizes property management, improves communication, and reduces manual work, so you can focus on growing your portfolio.",
  },
];

export default function WhyUsSection() {
  return (
    <section className="mt-10 md:mt-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          Why APT
        </span>

        <h2 className="font-nunito text-3xl font-bold text-brand md:text-5xl">
          Why Us?
        </h2>

        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          A comprehensive ecosystem designed to simplify the rental experience
          for everyone involved.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:mt-12 md:grid-cols-3">
        {REASONS.map((reason) => (
          <Surface
            key={reason.title}
            className="flex flex-col gap-4 rounded-2xl border border-divider bg-surface p-8"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {reason.icon}
            </div>

            <h3 className="font-nunito text-xl font-semibold">
              {reason.title}
            </h3>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {reason.body}
            </p>
          </Surface>
        ))}
      </div>
    </section>
  );
}
