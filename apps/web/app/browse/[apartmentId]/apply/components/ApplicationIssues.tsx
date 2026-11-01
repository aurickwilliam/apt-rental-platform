"use client";

import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { ApplicationIssue } from "@repo/passport";
import { APPLICATION_SLOT_KEYS, enumLabel, type TranslationKey } from "@repo/i18n";

import { passportFixHref } from "@/app/components/passport/passportSlots";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

/**
 * The fix offered for an issue. The government ID only comes from account
 * verification (it can't be uploaded), so a missing-documents card points at
 * the first slot the tenant can add; verification has its own "unverified"
 * card, and a verified account missing only its ID is sent to the Passport.
 */
function actionFor(issue: ApplicationIssue): { labelKey: TranslationKey; href: string } | null {
  switch (issue.code) {
    case "unverified":
      return { labelKey: "apply.action.verify", href: "/verify" };
    case "passport-missing": {
      const addable = issue.slots?.find((slot) => slot !== "govId");
      if (addable) return { labelKey: "apply.action.addToPassport", href: passportFixHref(addable) };
      return { labelKey: "apply.action.openPassport", href: "/tenant/passport" };
    }
    case "passport-expired":
      return { labelKey: "apply.action.openPassport", href: "/tenant/passport" };
    case "already-applied":
      return { labelKey: "apply.action.viewApplications", href: "/tenant/my-rental" };
    default:
      return null;
  }
}

/** Blocking problems that stop the tenant from applying, each with a fix. */
export default function ApplicationIssues({ issues }: { issues: ApplicationIssue[] }) {
  const { language, t } = useTranslation();

  if (issues.length === 0) return null;

  const slotList = (slots: ApplicationIssue["slots"]) =>
    (slots ?? [])
      .map((slot) =>
        APPLICATION_SLOT_KEYS[slot] ? enumLabel(language, APPLICATION_SLOT_KEYS, slot) : slot,
      )
      .join(", ");

  // The shared readiness rules stay language-free: compose the sentence here
  // from the issue code, and keep an unknown code's own English wording.
  const messageFor = (issue: ApplicationIssue) => {
    switch (issue.code) {
      case "unverified":
        return t("apply.issue.unverified");
      case "own-listing":
        return t("apply.issue.ownListing");
      case "already-applied":
        return t("apply.issue.alreadyApplied");
      case "passport-missing":
        return t("apply.issue.passportMissing", { slots: slotList(issue.slots) });
      case "passport-expired":
        return t("apply.issue.passportExpired", { slots: slotList(issue.slots) });
      default:
        return issue.message;
    }
  };

  return (
    <div className="space-y-3" role="alert">
      {issues.map((issue) => {
        const action = actionFor(issue);
        return (
          <div key={issue.code} className="space-y-2 rounded-2xl border border-danger/20 bg-danger/10 p-3">
            <div className="flex gap-2">
              <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              <p className="text-sm text-card-foreground">{messageFor(issue)}</p>
            </div>
            {action ? (
              <Link
                href={action.href}
                className={`cursor-pointer ${buttonVariants({ size: "sm", variant: "primary" })}`}
              >
                {t(action.labelKey)}
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
