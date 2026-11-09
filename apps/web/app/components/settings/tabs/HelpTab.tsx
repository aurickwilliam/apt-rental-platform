"use client";

import Link from "next/link";
import { IconAlertCircle, IconExternalLink } from "@tabler/icons-react";

import type { TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import SettingsRow from "../SettingsRow";
import ComingSoonChip from "../ComingSoonChip";
import { policyHref, type PolicyPortal } from "@/lib/policy-routes";

const FAQS: { id: number; questionKey: TranslationKey; answerKey: TranslationKey }[] = [
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
  activePortal = null,
}: {
  isAdmin?: boolean;
  activePortal?: PolicyPortal | null;
}) {
  const { t } = useTranslation();
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
        <section aria-labelledby="settings-faq-heading" className="mt-4">
          <h3 id="settings-faq-heading" className="font-nunito text-base font-bold text-foreground">
            {t("settings.help.faq")}
          </h3>
          <div className="mt-3 flex flex-col gap-3">
            {FAQS.map((faq) => (
              <article key={faq.id} className="rounded-xl bg-muted/30 p-4">
                <p className="font-nunito text-base font-semibold text-foreground">{t(faq.questionKey)}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(faq.answerKey)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <div className="mt-4 space-y-3">
        <Link
          href={policyHref("terms", activePortal)}
          className={linkClassName}
        >
          {isAdmin ? t("settings.help.terms.admin") : t("settings.help.terms")}
        </Link>
        <Link
          href={policyHref("privacy", activePortal)}
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
