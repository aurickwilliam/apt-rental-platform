"use client";

import { useLinkStatus } from "next/link";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

/** Next owns completion, interrupted navigations and failed transitions. */
export default function SidebarLinkPending({ label }: { label: string }) {
  const { t } = useTranslation();
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span role="status" data-navigation-pending="true">
      <span className="sr-only">{t("nav.opening", { page: label })}</span>
    </span>
  );
}
