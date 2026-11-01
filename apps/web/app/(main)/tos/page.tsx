import type { Metadata } from "next";

import { IconShieldCheck } from "@tabler/icons-react";

import LegalBulletList from "../components/legal/LegalBulletList";
import LegalContactCard from "../components/legal/LegalContactCard";
import LegalHero from "../components/legal/LegalHero";
import LegalSection from "../components/legal/LegalSection";
import LegalTableOfContents from "../components/legal/LegalTableOfContents";

import { BRAND, LEGAL_META, SECTIONS, TOC } from "./data/tos-sections";

export const metadata: Metadata = {
  title: "Terms and Conditions — APT",
  description:
    "The terms that govern your access to and use of APT, the rental platform for tenants and landlords in Camanava.",
};

const RELATED_POLICIES = [
  { href: "/pap", label: "Privacy Policy" },
  { href: "/cookies", label: "Cookie Policy" },
];

export default function TosPage() {
  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      <LegalHero
        eyebrow="Legal"
        title="Terms and"
        titleAccent="Conditions"
        description="Please read these terms carefully before using APT. By creating an account or using our services, you agree to be bound by these terms."
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
              {section.intro ? <p>{section.intro}</p> : null}
              {section.list ? <LegalBulletList items={section.list} /> : null}
              {section.body?.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </LegalSection>
          ))}

          <LegalContactCard brand={BRAND} related={RELATED_POLICIES} />
        </article>
      </div>
    </div>
  );
}
