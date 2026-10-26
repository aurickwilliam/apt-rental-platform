"use client";

import { useState } from "react";
import Link from "next/link";
import { IconAlertCircle, IconChevronDown, IconChevronUp, IconExternalLink, IconHelpCircle } from "@tabler/icons-react";
import { Accordion, AccordionBody, AccordionIndicator, AccordionItem, AccordionPanel, AccordionTrigger } from "@heroui/react";

import type { TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import SettingsRow from "../SettingsRow";
import ComingSoonChip from "../ComingSoonChip";

const FAQ_KEYS: { id: number; questionKey: TranslationKey; answerKey: TranslationKey }[] = [
  { id: 1, questionKey: "settings.help.faq.1.question", answerKey: "settings.help.faq.1.answer" },
  { id: 2, questionKey: "settings.help.faq.2.question", answerKey: "settings.help.faq.2.answer" },
  { id: 3, questionKey: "settings.help.faq.3.question", answerKey: "settings.help.faq.3.answer" },
  { id: 4, questionKey: "settings.help.faq.4.question", answerKey: "settings.help.faq.4.answer" },
  { id: 5, questionKey: "settings.help.faq.5.question", answerKey: "settings.help.faq.5.answer" },
  { id: 6, questionKey: "settings.help.faq.6.question", answerKey: "settings.help.faq.6.answer" },
];

const linkClassName =
  "block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function HelpTab({
  isAdmin = false,
}: {
  isAdmin?: boolean;
}) {
  const { t } = useTranslation();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const ExpandIcon = faqsOpen ? IconChevronUp : IconChevronDown;

  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">
        {t("settings.help.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {isAdmin
          ? t("settings.help.admin.description")
          : t("settings.help.description")}
      </p>
      {!isAdmin ? (
        <div className="mt-3 divide-y divide-border">
          <SettingsRow
            icon={<IconAlertCircle size={18} />}
            title={t("settings.help.reportProblem")}
            disabled
            suffix={<ComingSoonChip />}
          />
        </div>
      ) : null}
      {!isAdmin ? (
        <div className="mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <SettingsRow
              icon={<IconHelpCircle size={18} />}
              title={t("settings.help.faq")}
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
            {FAQ_KEYS.map((faq) => (
              <AccordionItem key={faq.id} id={String(faq.id)} className="rounded-lg bg-muted/30 px-2 overflow-hidden">
                <AccordionTrigger className="w-full flex items-center justify-between p-4 text-left font-nunito font-semibold text-base text-foreground">
                  <span className="pr-4">
                    {t(faq.questionKey)}
                  </span>
                  <AccordionIndicator className="text-muted-foreground flex-shrink-0" />
                </AccordionTrigger>
                <AccordionPanel>
                  <AccordionBody className="px-4 pb-4">
                    <p className="text-muted-foreground text-sm leading-relaxed">{t(faq.answerKey)}</p>
                  </AccordionBody>
                </AccordionPanel>
              </AccordionItem>
            ))}
            </Accordion>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 space-y-3">
        <Link
          href="/tos"
          className={linkClassName}
        >
          {isAdmin ? t("settings.help.terms.admin") : t("settings.help.terms")}
        </Link>
        <Link
          href="/pap"
          className={linkClassName}
        >
          {t("settings.help.privacy")}
        </Link>
        {isAdmin ? (
          <Link
            href="/cookies"
            className={linkClassName}
          >
            {t("settings.help.cookies")}
          </Link>
        ) : (
          <Link
            href="/about"
            className={linkClassName}
          >
            {t("settings.help.about")}
          </Link>
        )}
      </div>
      {isAdmin ? (
        <Link
          href="/about"
          className="mt-4 inline-block text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("settings.help.learnMore")}{" "}
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
