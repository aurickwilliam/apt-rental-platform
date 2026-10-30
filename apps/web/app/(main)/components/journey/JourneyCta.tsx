import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconArrowRight } from "@tabler/icons-react";
import styles from "./journey.module.css";

export default function JourneyCta() {
  return (
    <section data-journey-cta aria-labelledby="journey-cta-title" className={styles.conclusion}>
      <div data-cta-accents aria-hidden="true" className={styles.ctaAccents}>
        <svg viewBox="0 0 800 240" preserveAspectRatio="none" focusable="false" aria-hidden="true">
          <path d="M 4 12 V 228 M 796 12 V 228" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <h2 id="journey-cta-title" className="font-nunito">Your next chapter starts here.</h2>
      <p>Discover a place that fits your lifestyle with APT.</p>
      <Link href="/browse" prefetch={false} className={buttonVariants({ variant: "primary", className: `landing-cta ${styles.ctaLink}` })}>
        Browse Apartments <IconArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
