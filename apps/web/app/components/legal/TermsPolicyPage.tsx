import type { Metadata } from "next";

import { IconShieldCheck } from "@tabler/icons-react";

import LegalBulletList from "@/app/(main)/components/legal/LegalBulletList";
import LegalHero from "@/app/(main)/components/legal/LegalHero";
import LegalSection from "@/app/(main)/components/legal/LegalSection";
import LegalTableOfContents from "@/app/(main)/components/legal/LegalTableOfContents";

import { LEGAL_META, SECTIONS, TOC } from "@/app/(main)/tos/data/tos-sections";
import PolicyBackButton from "./PolicyBackButton";
import PolicyBackToTopButton from "./PolicyBackToTopButton";

const HEADING_ID = "terms-policy-heading";

export const termsPolicyMetadata: Metadata = {
  title: "Terms and Conditions — APT",
  description:
    "The terms that govern your access to and use of APT, the rental platform for tenants and landlords in Camanava.",
};

export default function TermsPolicyPage({ layout = "public" }: { layout?: "public" | "portal" } = {}) {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <LegalHero
        headingId={HEADING_ID}
        navigation={<PolicyBackButton />}
        eyebrow="Legal"
        title="Terms and"
        titleAccent="Conditions"
        description="Please read these terms carefully before using APT. By creating an account or using our services, you agree to be bound by these terms."
        meta={LEGAL_META}
        icon={<IconShieldCheck size={14} aria-hidden="true" />}
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8 lg:pt-10">
        <LegalTableOfContents items={TOC} layout={layout} />

        <article className="min-w-0 max-w-4xl">
          {SECTIONS.map((section) => (
            <LegalSection
              key={section.id}
              id={section.id}
              num={section.num}
              title={section.title}
              emphasis={section.emphasis}
              callout={section.callout}
            >
              {section.intro ? <p>{section.intro}</p> : null}
              {section.list ? <LegalBulletList items={section.list} /> : null}
              {section.body?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </LegalSection>
          ))}
          <PolicyBackToTopButton headingId={HEADING_ID} />
        </article>
      </div>
    </div>
  );
}
