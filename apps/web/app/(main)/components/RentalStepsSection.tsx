import Image from "next/image";
import {
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconChevronRight,
  IconMapPin,
  IconSearch,
} from "@tabler/icons-react";

import LandingReveal from "./LandingReveal";
import design from "./landing-design.module.css";

const STEPS = [
  {
    number: "01",
    title: "Discover",
    description:
      "Browse verified apartments, compare the details, and see what is available around CAMANAVA on the map.",
  },
  {
    number: "02",
    title: "Apply",
    description:
      "Open the apartment you like and submit a rental application with your APT Passport documents attached.",
  },
  {
    number: "03",
    title: "Move in",
    description:
      "Agree on the terms with the property owner, review the signed lease, and settle your move-in bill.",
  },
  {
    number: "04",
    title: "Manage",
    description:
      "Track rent, message your landlord, and send maintenance requests through APT.",
  },
] as const;

function JourneyConnector() {
  return (
    <div aria-hidden="true" className={design.connector}>
      <span className={design.connectorLine} />
      <IconChevronRight className={`${design.connectorIcon} hidden lg:block`} size={16} stroke={1.75} />
      <IconChevronDown className={`${design.connectorIcon} lg:hidden`} size={16} stroke={1.75} />
      <span className={design.connectorLine} />
    </div>
  );
}

export default function RentalStepsSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="rental-steps-title"
      className={`scroll-mt-24 ${design.steps}`}
    >
      <div className={design.stepsPanel}>
        <LandingReveal name="rental-heading" duration={0.7} className={design.stepsIntro}>
          <p className={`uppercase text-secondary-foreground ${design.eyebrow}`}>How it works</p>
          <h2 id="rental-steps-title" className={`mt-4 font-nunito text-foreground ${design.sectionTitle}`}>
            From browsing to move-in.
          </h2>
          <p className="mt-3 text-lg leading-8 text-foreground/75">
            Four simple stages take you from finding a verified apartment to managing the home you chose.
          </p>
        </LandingReveal>

        <div className={design.journeyBoard}>
          <LandingReveal
            name="rental-discovery"
            delay={0.08}
            duration={0.6}
            className={design.discoveryCluster}
          >
            <div className={design.miniCard}>
              <p className={design.miniCardHeader}>
                <IconSearch size={16} stroke={1.75} aria-hidden="true" />
                Search by name or location
              </p>
              <p className={design.miniCardNote}>
                <IconMapPin size={14} stroke={1.75} aria-hidden="true" />
                Caloocan · Malabon · Navotas · Valenzuela
              </p>
            </div>

            <figure className={`${design.miniCard} ${design.mapCard}`}>
              <div className={design.mapFrame}>
                <Image
                  src="/landing/showcase-browse-layer.png"
                  alt="APT browse map showing available apartments across Camanava"
                  fill
                  sizes="(min-width: 1280px) 307px, (min-width: 1024px) 24vw, (min-width: 640px) calc(100vw - 124px), calc(100vw - 108px)"
                  loading="lazy"
                  className="object-cover object-right"
                />
              </div>
              <figcaption className={design.mapCaption}>
                <IconMapPin size={14} stroke={1.75} aria-hidden="true" />
                See available homes on the map
              </figcaption>
            </figure>

            <div className={design.miniCard}>
              <p className={design.miniCardHeader}>
                <IconAdjustmentsHorizontal size={16} stroke={1.75} aria-hidden="true" />
                Filter by what matters
              </p>
              <div className={design.filterChips}>
                <span className={design.filterChip}>Location</span>
                <span className={design.filterChip}>Budget</span>
                <span className={design.filterChip}>Amenities</span>
              </div>
            </div>
          </LandingReveal>

          <JourneyConnector />

          <LandingReveal name="rental-process" delay={0.14} duration={0.6}>
            <ol role="list" className={design.processCard}>
              {STEPS.map((step) => (
                <li key={step.number} className={design.processStep}>
                  <span aria-hidden="true" className={design.processMarker}>{step.number}</span>
                  <div className={design.processCopy}>
                    <h3 className={design.processTitle}>{step.title}</h3>
                    <p className={design.processDescription}>{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </LandingReveal>

          <JourneyConnector />

          <LandingReveal name="rental-preview" delay={0.2} duration={0.6} className={design.phonePreview}>
            <Image
              src="/landing/app-mobile-my-rental.png"
              alt="APT Mobile showing the current monthly rent, a Pay Now action, and rental quick actions"
              width={990}
              height={1165}
              sizes="(min-width: 1024px) 266px, 240px"
              className={design.phoneImage}
            />
            <figcaption className={design.phoneCaption}>
              <span className={design.phoneCaptionLabel}>APT MOBILE</span>
              Your rent, requests, and messages stay within reach.
            </figcaption>
          </LandingReveal>
        </div>
      </div>
    </section>
  );
}
