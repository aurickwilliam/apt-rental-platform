import type { Metadata } from "next";

import { IconShieldCheck } from "@tabler/icons-react";

import LegalBlocks from "@/app/(main)/components/legal/LegalBlocks";
import LegalHero from "@/app/(main)/components/legal/LegalHero";
import LegalSection from "@/app/(main)/components/legal/LegalSection";
import LegalTableOfContents from "@/app/(main)/components/legal/LegalTableOfContents";

import { LEGAL_META, SECTIONS, TOC } from "@/app/(main)/pap/data/pap-sections";

const DESCRIPTION =
  "This Privacy Policy explains how APT collects, uses, stores, discloses, and protects your personal information when you use our website and mobile application.";

export const privacyPolicyMetadata: Metadata = {
  title: "Privacy Policy — APT",
  description: DESCRIPTION,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <LegalHero
        eyebrow="Legal"
        title="Privacy"
        titleAccent="Policy"
        description={DESCRIPTION}
        meta={LEGAL_META}
        icon={<IconShieldCheck size={14} aria-hidden="true" />}
      />

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8 lg:pt-10">
        <LegalTableOfContents items={TOC} />

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
              <LegalBlocks blocks={section.blocks} />
            </LegalSection>
          ))}
        </article>
      </div>
    </div>
  );
}
