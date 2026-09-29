"use client";

import SettingsShell from "../components/SettingsShell";
import LegalSections from "../components/LegalSections";
import { SECTIONS } from "@/app/(main)/tos/data/tos-sections";

export default function TermsPage() {
  return (
    <SettingsShell title="Terms and Conditions" subtitle="Last updated: June 2025" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        <LegalSections sections={SECTIONS} />
      </div>
    </SettingsShell>
  );
}
