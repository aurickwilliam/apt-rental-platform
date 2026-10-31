import { Card } from "@heroui/react";
import { IconArrowRight } from "@tabler/icons-react";

import LandingCta from "./LandingCta";
import LandingReveal from "./LandingReveal";
import styles from "./landing-motion.module.css";
import design from "./landing-design.module.css";

export default function OwnerCtaSection() {
  return (
    <section aria-labelledby="owner-cta-title" className={design.owner}>
      <LandingReveal name="owner-cta" distance={12} duration={0.8} className={styles.owner}>
      <Card variant="secondary" className={`flex-col gap-8 rounded-2xl shadow-none md:flex-row md:items-center md:justify-between ${design.ownerCard}`}>
        <div>
          <p className={`uppercase text-secondary-foreground ${design.eyebrow}`}>For property owners</p>
          <h2 id="owner-cta-title" className={`mt-4 font-nunito text-foreground ${design.ownerTitle}`}>Have a property to rent out?</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-foreground/75">
            List your property and manage rental applications and tenant communication with APT.
          </p>
        </div>
        <LandingCta href="/forowners" className="shrink-0">
          Explore owner tools <IconArrowRight size={16} aria-hidden="true" />
        </LandingCta>
      </Card>
      </LandingReveal>
    </section>
  );
}
