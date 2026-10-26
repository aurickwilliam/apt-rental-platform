import { Card } from "@heroui/react";
import { IconArrowRight } from "@tabler/icons-react";

import LandingCta from "./LandingCta";

export default function OwnerCtaSection() {
  return (
    <section aria-labelledby="owner-cta-title" className="my-12 sm:my-16">
      <Card variant="secondary" className="flex-col gap-8 rounded-2xl p-6 shadow-none sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-foreground">For property owners</p>
          <h2 id="owner-cta-title" className="mt-4 font-nunito text-2xl font-bold tracking-tight text-foreground">Have a property to rent out?</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-foreground/75">
            List your property and manage rental applications and tenant communication with APT.
          </p>
        </div>
        <LandingCta href="/forowners" className="shrink-0">
          Explore owner tools <IconArrowRight size={16} aria-hidden="true" />
        </LandingCta>
      </Card>
    </section>
  );
}
