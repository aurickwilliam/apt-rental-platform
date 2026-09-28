"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import SettingsShell from "../components/SettingsShell";

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

export default function FAQPage() {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <SettingsShell title="Frequently Asked Questions" subtitle="Find answers to common questions" showBack>
      <div className="p-4 sm:p-5 space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="rounded-lg bg-muted/30">
            <button
              type="button"
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
              aria-expanded={openId === faq.id}
              aria-controls={`faq-answer-${faq.id}`}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-nunito font-semibold text-base text-foreground pr-4">
                {faq.question}
              </span>
              <ChevronDown
                size={18}
                className={`text-muted-foreground transition-transform flex-shrink-0 ${openId === faq.id ? "rotate-180" : ""}`}
              />
            </button>
            {openId === faq.id && (
              <div id={`faq-answer-${faq.id}`} className="px-4 pt-4 pb-4 border-t border-border">
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}

      </div>
    </SettingsShell>
  );
}