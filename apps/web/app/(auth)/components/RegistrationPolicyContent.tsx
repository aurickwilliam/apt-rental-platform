"use client";

import { Alert } from "@heroui/react";
import { memo } from "react";
import { IconInfoCircleFilled } from "@tabler/icons-react";
import LegalBlocks from "../../(main)/components/legal/LegalBlocks";
import LegalBulletList from "../../(main)/components/legal/LegalBulletList";
import LegalContactCard from "../../(main)/components/legal/LegalContactCard";
import LegalSection from "../../(main)/components/legal/LegalSection";
import { BRAND as PRIVACY_BRAND, LEGAL_META as PRIVACY_META, SECTIONS as PRIVACY_SECTIONS } from "../../(main)/pap/data/pap-sections";
import { BRAND as TERMS_BRAND, LEGAL_META as TERMS_META, SECTIONS as TERMS_SECTIONS } from "../../(main)/tos/data/tos-sections";
import { REGISTRATION_POLICIES, type RegistrationPolicy } from "@/lib/registration-policies";

interface RegistrationPolicyContentProps {
  policy: RegistrationPolicy;
  instanceId: string;
}

function RegistrationPolicyContent({ policy, instanceId }: RegistrationPolicyContentProps) {
  const isPrivacy = policy === "privacy";
  const meta = isPrivacy ? PRIVACY_META : TERMS_META;
  const brand = isPrivacy ? PRIVACY_BRAND : TERMS_BRAND;
  return (
    <article aria-label={REGISTRATION_POLICIES[policy].label}>
      <Alert status="accent" role="note" className="registration-policy-meta">
        <Alert.Indicator><IconInfoCircleFilled size={20} aria-hidden="true" /></Alert.Indicator>
        <Alert.Content>
          <Alert.Title>{REGISTRATION_POLICIES[policy].label} · Version {meta.version}</Alert.Title>
          <Alert.Description>
            <span>Last updated: {meta.lastUpdated}</span>
            <span aria-hidden="true" className="registration-policy-meta-separator">|</span>
            <span>{meta.jurisdiction}</span>
          </Alert.Description>
        </Alert.Content>
      </Alert>
      {isPrivacy ? PRIVACY_SECTIONS.map(section => (
        <LegalSection key={section.id} {...section} id={`${instanceId}-privacy-${section.id}`} headingLevel={3}>
          <LegalBlocks blocks={section.blocks} />
        </LegalSection>
      )) : TERMS_SECTIONS.map(section => (
        <LegalSection key={section.id} {...section} id={`${instanceId}-terms-${section.id}`} headingLevel={3}>
          {section.intro ? <p>{section.intro}</p> : null}
          {section.list ? <LegalBulletList items={section.list} /> : null}
          {section.body?.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </LegalSection>
      ))}
      <LegalContactCard
        brand={brand}
        headingLevel={3}
        {...(isPrivacy ? { eyebrow: "Questions about this Privacy Policy?", description: null } : {})}
      />
    </article>
  );
}

export default memo(RegistrationPolicyContent);
