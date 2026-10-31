import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconArrowRight } from "@tabler/icons-react";

import ThemeToggle from "@/app/components/layout/ThemeToggle";
import ProductShowcaseSection from "@/app/(main)/components/ProductShowcaseSection";
import RentalStepsSection from "@/app/(main)/components/RentalStepsSection";
import OwnerCtaSection from "@/app/(main)/components/OwnerCtaSection";
import HeroScaffold from "./HeroScaffold";
import FeaturedScaffold from "./FeaturedScaffold";
import JourneyScene from "./JourneyScene";
import styles from "./journey-demo.module.css";

export default function JourneyDemo() {
  return (
    <div data-journey-demo className={styles.page}>
      <noscript><style>{"[data-journey-demo] [data-landing-reveal] { opacity: 1 !important; transform: none !important; }"}</style></noscript>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Image src="/logo/logo-name-transparent.svg" alt="APT" width={100} height={40} />
          <span className={styles.previewLabel}>Local journey study</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6">
        <p className={styles.notice}>
          Prototype only. Scroll down to draw the journey; scroll up to retrace it.
          Hero and apartment cards are static layout references, not live listings.
        </p>
        <HeroScaffold />
        <JourneyScene>
          <FeaturedScaffold />
          <ProductShowcaseSection />
          <RentalStepsSection />
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
        </JourneyScene>
        <OwnerCtaSection />
        <p className={styles.contextNote}>
          End of the journey study. The production page continues with APT Mobile, Our Team,
          FAQs, Contact Us and the Footer. They are not reproduced here.
        </p>
      </main>
    </div>
  );
}
