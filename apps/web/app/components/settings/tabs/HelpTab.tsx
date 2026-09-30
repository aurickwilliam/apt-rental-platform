"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ChevronDown, ChevronUp, ExternalLink, HelpCircle } from "lucide-react";
import { IconAlertCircle, IconChevronDown, IconChevronUp, IconExternalLink, IconHelpCircle } from "@tabler/icons-react";
import { Accordion, AccordionBody, AccordionIndicator, AccordionItem, AccordionPanel, AccordionTrigger } from "@heroui/react";

import SettingsRow from "../SettingsRow";
import ComingSoonChip from "../ComingSoonChip";

const faqs = [
  {
    id: 1,
    question: "How do I pay my rent?",
    answer: "You can pay your rent through the app by going to Rentals > Pay Rent and selecting your preferred payment method (GCash, Maya, or card).",
  },
  {
    id: 2,
    question: "How do I submit a maintenance request?",
    answer: "Go to your Rentals page and click 'Request Maintenance'. Fill in the details of the issue and submit. Your landlord will be notified.",
  },
  {
    id: 3,
    question: "How do I view my lease agreement?",
    answer: "Go to your Rentals page and click 'View Lease'. You can view and download your lease agreement from there.",
  },
  {
    id: 4,
    question: "How do I contact my landlord?",
    answer: "You can message your landlord directly through the Chat page or by clicking 'Chat Landlord' in your Rentals quick actions.",
  },
  {
    id: 5,
    question: "How do I list my property?",
    answer: "As a landlord, go to the Units page and click the '+' button to add a new apartment listing. Fill in the required details across the steps.",
  },
  {
    id: 6,
    question: "How do I verify my account?",
    answer: "Go to your Profile page and click on 'Verify Account'. You will need to upload a valid government-issued ID and a selfie.",
  },
];

const linkClassName =
  "block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function HelpTab({
  isAdmin = false,
  iconSet = "lucide",
}: {
  isAdmin?: boolean;
  iconSet?: "lucide" | "tabler";
}) {
  const [faqsOpen, setFaqsOpen] = useState(false);
  const ReportIcon = iconSet === "tabler" ? IconAlertCircle : AlertCircle;
  const ExternalIcon = iconSet === "tabler" ? IconExternalLink : ExternalLink;
  const FaqIcon = iconSet === "tabler" ? IconHelpCircle : HelpCircle;
  const ExpandIcon =
    iconSet === "tabler"
      ? faqsOpen
        ? IconChevronUp
        : IconChevronDown
      : faqsOpen
        ? ChevronUp
        : ChevronDown;

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        Help &amp; Support
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? "Need help or want to read our policies?"
          : "Find answers and read our policies."}
      </p>
      {isAdmin ? (
        <div className="mt-4 space-y-3">
          <a
            href="mailto:support@apt-rental.ph"
            className={linkClassName}
          >
            Report a problem · support@apt-rental.ph
          </a>
        </div>
      ) : (
        <div className="mt-3 divide-y divide-border">
          <SettingsRow
            icon={<ReportIcon size={18} />}
            title="Report a Problem"
            disabled
            suffix={<ComingSoonChip />}
          />
        </div>
      )}
      <div className="mt-4">
        <div className="rounded-xl border border-border overflow-hidden">
          <SettingsRow
            icon={<FaqIcon size={18} />}
            title="Frequently Asked Questions"
            onClick={() => setFaqsOpen((v) => !v)}
            hideChevron
            expanded={faqsOpen}
            controlsId="settings-faq-list"
            suffix={
              <ExpandIcon size={16} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
            }
          />
        </div>
        {faqsOpen ? (
          <Accordion id="settings-faq-list" className="mt-3 flex flex-col gap-3">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} id={String(faq.id)} className="rounded-lg bg-muted/30 px-2 overflow-hidden">
              <AccordionTrigger className="w-full flex items-center justify-between p-4 text-left font-nunito font-semibold text-base text-foreground">
                <span className="pr-4">
                  {faq.question}
                </span>
                <AccordionIndicator className="text-muted-foreground flex-shrink-0" />
              </AccordionTrigger>
              <AccordionPanel>
                <AccordionBody className="px-4 pb-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                </AccordionBody>
              </AccordionPanel>
            </AccordionItem>
          ))}
          </Accordion>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        <Link
          href="/tos"
          className={linkClassName}
        >
          {isAdmin ? "Terms and conditions" : "Terms of Service"}
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
        <>
          <div className="mt-4 rounded-xl border border-border p-4">
            <p className="font-nunito text-xl font-bold text-primary">
              APT — A Place to Thrive
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Connecting renters and property owners in the
              Philippines.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              APT web portal
            </p>
          </div>
          <Link
            href="/about"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Learn more about APT{" "}
            <ExternalIcon
              size={16}
              className="ml-1 inline"
              aria-hidden="true"
            />
          </Link>
        </>
      ) : null}
    </>
  );
}
