import {
  Accordion,
  AccordionBody,
  AccordionHeading,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@heroui/react";

import LandingReveal from "./LandingReveal";
import design from "./landing-design.module.css";

const FAQS = [
  {
    id: "pay-rent",
    question: "How do I pay my rent?",
    answer:
      "Open My Rental and choose Pay now on your current bill. Online checkout currently runs in test mode and does not process real money. Cash payments stay pending until the property owner confirms them.",
  },
  {
    id: "maintenance",
    question: "How do I submit a maintenance request?",
    answer:
      "Open Maintenance from My Rental, choose Request Maintenance, describe the issue, and set how urgent it is. Your landlord can review and respond inside APT.",
  },
  {
    id: "lease",
    question: "How do I review my lease agreement?",
    answer:
      "Your landlord uploads the signed lease to the tenancy. In My Rental, open Signed lease to view the current document and confirm that you have read it.",
  },
  {
    id: "landlord",
    question: "How do I contact my landlord?",
    answer:
      "Use Messages in APT to contact your landlord. Apartment-related conversations keep questions and updates about that property in one thread.",
  },
  {
    id: "list-property",
    question: "How do I list my property?",
    answer:
      "Create a landlord account, then add the property from Properties. Add the CAMANAVA address, rent and deposit terms, amenities, and photos, then publish it for review.",
  },
  {
    id: "verify-account",
    question: "How do I verify my account?",
    answer:
      "Open Profile and choose Verify Account. On the web, APT shows a QR code that hands the ID and selfie capture to your phone; if approved, your verified status appears across your profile and Passport.",
  },
] as const;

const COLUMNS = [FAQS.slice(0, 3), FAQS.slice(3)];

export default function FaqSection() {
  return (
    <section id="faqs" aria-labelledby="faqs-title" className={`scroll-mt-24 ${design.faqs}`}>
      <LandingReveal name="faqs-heading" duration={0.7} className={design.centeredIntro}>
        <p className={`uppercase text-secondary-foreground ${design.eyebrow}`}>FAQs</p>
        <h2 id="faqs-title" className={`mt-4 font-nunito text-foreground ${design.sectionTitle}`}>
          Questions, answered.
        </h2>
        <p className="mt-3 text-lg leading-8 text-foreground/75">
          Short answers about renting, listing a property, and managing your account on APT.
        </p>
      </LandingReveal>

      <div className={design.faqGrid}>
        {COLUMNS.map((column, columnIndex) => (
          <LandingReveal
            key={columnIndex}
            name={`faq-column-${columnIndex + 1}`}
            delay={columnIndex * 0.08}
            duration={0.6}
            className="min-w-0"
          >
            <Accordion hideSeparator className={design.faqColumn}>
              {column.map((faq) => (
                <div key={faq.id} className={design.faqRow}>
                  <AccordionItem id={faq.id}>
                    <AccordionHeading>
                      <AccordionTrigger className={design.faqTrigger}>
                        <span className="pr-4">{faq.question}</span>
                        <AccordionIndicator className={design.faqIndicator} />
                      </AccordionTrigger>
                    </AccordionHeading>
                    <AccordionPanel>
                      <AccordionBody className={design.faqBody}>
                        <p>{faq.answer}</p>
                      </AccordionBody>
                    </AccordionPanel>
                  </AccordionItem>
                </div>
              ))}
            </Accordion>
          </LandingReveal>
        ))}
      </div>
    </section>
  );
}
