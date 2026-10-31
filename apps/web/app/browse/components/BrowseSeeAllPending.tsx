"use client";

import { useLinkStatus } from "next/link";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

/** Next owns cancellation/completion; loaded cards never depend on this status. */
export default function BrowseSeeAllPending() {
  const { pending } = useLinkStatus();
  const { t } = useTranslation();
  return pending ? <span role="status" className="ml-1 text-xs text-muted-foreground">{t("browse.section.opening")}</span> : null;
}
