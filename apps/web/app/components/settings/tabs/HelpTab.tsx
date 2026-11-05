"use client";

import Link from "next/link";
import { IconAlertCircle, IconExternalLink } from "@tabler/icons-react";

import SettingsRow from "../SettingsRow";
import ComingSoonChip from "../ComingSoonChip";

const faqs = [
  {
    id: 1,
    question: "How do I pay my rent?",
    answer:
      "Open My Rental and choose Pay now on your current bill, then pick your payment method. Online checkout currently runs in test mode and does not process real money, and cash payments stay pending until your property owner confirms them.",
  },
  {
    id: 2,
    question: "How do I submit a maintenance request?",
    answer:
      "Open Maintenance from My Rental, choose Request Maintenance, describe the issue, and set how urgent it is. Your landlord can review and respond inside APT.",
  },
  {
    id: 3,
    question: "How do I view my lease agreement?",
    answer:
      "Once your landlord has uploaded it, open Signed lease in My Rental to view the current document and confirm that you have read it.",
  },
  {
    id: 4,
    question: "How do I contact my landlord?",
    answer:
      "Use Messages to contact your landlord. Apartment-related conversations keep questions and updates about that property in one thread.",
  },
  {
    id: 5,
    question: "How do I list my property?",
    answer:
      "From My Properties in the landlord portal, add a new listing with the CAMANAVA address, rent and deposit terms, amenities, and photos, then publish it for review.",
  },
  {
    id: 6,
    question: "How do I verify my account?",
    answer:
      "Open your profile and choose Verify Account. Phones and tablets capture your government ID and a selfie right in the browser; on a desktop you can scan a QR code to continue on your phone or use your webcam.",
  },
];

const linkClassName =
  "block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function HelpTab({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        Help &amp; Support
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? "Read our policies and learn more about APT."
          : "Find answers and read our policies."}
      </p>
      {!isAdmin ? (
        <div className="mt-3 divide-y divide-border">
          <SettingsRow
            icon={<IconAlertCircle size={18} />}
            title="Report a Problem"
            disabled
            suffix={<ComingSoonChip />}
          />
        </div>
      ) : null}
      {!isAdmin ? (
        <section aria-labelledby="settings-faq-heading" className="mt-4">
          <h3 id="settings-faq-heading" className="font-nunito text-base font-bold text-foreground">
            Frequently Asked Questions
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            {faqs.map((faq) => (
              <article key={faq.id} className="rounded-xl bg-muted/30 p-4">
                <p className="font-nunito text-base font-semibold text-foreground">{faq.question}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mt-4 space-y-3">
        <Link
          href="/tos"
          className={linkClassName}
        >
          Terms and Conditions
        </Link>
        <Link
          href="/pap"
          className={linkClassName}
        >
          Privacy Policy
        </Link>
        {isAdmin ? (
          <Link
            href="/cookies"
            className={linkClassName}
          >
            Cookie policy
          </Link>
        ) : (
          <Link
            href="/about"
            className={linkClassName}
          >
            About Us
          </Link>
        )}
      </div>
      {isAdmin ? (
        <Link
          href="/about"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Learn more about APT{" "}
          <IconExternalLink
            size={16}
            className="ml-1 inline"
            aria-hidden="true"
          />
        </Link>
      ) : null}
    </>
  );
}
