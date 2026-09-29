"use client";

import SettingsShell from "../components/SettingsShell";
import LegalSections from "../components/LegalSections";
import { SECTIONS } from "@/app/(main)/cookies/data/cookies-sections";

export default function PrivacyPolicyPage() {
  return (
    <SettingsShell title="Privacy Policy" subtitle="Last updated: June 2025" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        <LegalSections sections={SECTIONS} />
      </div>
    </SettingsShell>
  );
}
