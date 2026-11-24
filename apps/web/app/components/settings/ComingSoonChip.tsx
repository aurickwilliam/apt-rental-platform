"use client";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import StatusChip from "./StatusChip";

export default function ComingSoonChip() {
  const { t } = useTranslation();
  return <StatusChip label={t("common.comingSoon")} />;
}
