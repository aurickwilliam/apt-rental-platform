import type { Metadata } from "next";

import { IconCookie } from "@tabler/icons-react";

import LegalBlocks from "../components/legal/LegalBlocks";
import LegalContactCard from "../components/legal/LegalContactCard";
import LegalHero from "../components/legal/LegalHero";
import LegalSection from "../components/legal/LegalSection";
import LegalTableOfContents from "../components/legal/LegalTableOfContents";

import { BRAND, LEGAL_META, SECTIONS, TOC } from "./data/cookies-sections";

const DESCRIPTION =
  "This Cookie Policy explains how APT uses cookies and similar technologies to improve your experience on our website and mobile application.";

export const metadata: Metadata = {
  title: "Cookie Policy — APT",
  description: DESCRIPTION,
};

const RELATED_POLICIES = [
  { href: "/tos", label: "Terms of Service" },
  { href: "/pap", label: "Privacy Policy" },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <LegalHero
        eyebrow="Legal"
        title="Cookie"
        titleAccent="Policy"
        description={DESCRIPTION}
        meta={LEGAL_META}
        icon={<IconCookie size={14} aria-hidden="true" />}
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

          <LegalContactCard
            brand={BRAND}
            related={RELATED_POLICIES}
            eyebrow="Questions about this Cookie Policy?"
            description={null}
          />
        </article>
      </div>
    </div>
  );
}
