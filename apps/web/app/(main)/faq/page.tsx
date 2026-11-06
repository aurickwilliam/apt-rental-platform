import type { Metadata } from "next";

import FaqSection from "../components/FaqSection";
import ContactSection from "../components/ContactSection";

export const metadata: Metadata = {
  title: "FAQs — APT",
  description:
    "Short answers about renting, listing a property, and managing your account on APT — plus how to reach the APT team.",
};

export default function FaqPage() {
  return (
    <main className="min-h-screen">
      {/* The FAQ section's own top border reads as a content rule; keep it off
          the navbar's bottom border with a little breathing room. */}
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <FaqSection />
        <ContactSection />
      </div>
    </main>
  );
}
