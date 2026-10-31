import Image from "next/image";
import { Button } from "@heroui/react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import design from "@/app/(main)/components/landing-design.module.css";
import styles from "./journey-demo.module.css";

/** Match carousel card footprints, not its live data, ranking or interactions. */
export default function FeaturedScaffold() {
  return (
    <section className="pb-8 sm:pb-12" aria-labelledby="preview-featured-title">
      <div data-journey-featured className="mt-10">
        <div className={`flex items-center justify-between gap-4 ${design.featuredHeader}`}>
          <div>
            <h2 id="preview-featured-title" className={`font-nunito ${design.listingTitle}`}>Apartments Tenants Love</h2>
            <p className="mt-1 text-base text-muted-foreground">Illustrative cards · no live availability or pricing.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button isIconOnly variant="outline" isDisabled aria-label="Previous apartments (static reference)"><IconChevronLeft size={18} aria-hidden="true" /></Button>
            <Button isIconOnly variant="outline" isDisabled aria-label="Next apartments (static reference)"><IconChevronRight size={18} aria-hidden="true" /></Button>
          </div>
        </div>
        <div className={styles.fixtureRail}>
          {Array.from({ length: 6 }, (_, index) => (
            <figure key={index} className={styles.fixtureCard}>
              <Image src="/landing/hero-living-room.png" alt="Illustrative apartment interior" width={600} height={600} sizes="(min-width: 640px) 208px, 160px" loading="lazy" />
              <figcaption>
                <h3 className="font-nunito">Apartment preview {index + 1}</h3>
                <p>Static layout reference</p>
                <p className={styles.fixtureDetail}>Listing card footprint</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
