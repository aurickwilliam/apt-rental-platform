"use client";

import Link from "next/link";
import { IconInfoCircle } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

/** Explains that there is no upload step: the APT Passport is attached. */
export default function PassportNotice() {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 rounded-2xl border border-primary/30 bg-accent p-3">
      <IconInfoCircle size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-card-foreground">{t("apply.passport.title")}</p>
        <p className="text-sm text-muted-foreground">
          {t("apply.passport.bodyBefore")}{" "}
          <Link href="/tenant/passport" className="font-medium text-primary hover:underline">
            {t("apply.passport.link")}
          </Link>
          {t("apply.passport.bodyAfter")}
        </p>
      </div>
    </div>
  );
}
