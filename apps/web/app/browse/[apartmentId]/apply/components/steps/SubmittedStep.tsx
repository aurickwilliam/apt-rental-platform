"use client";

import NextImage from "next/image";
import Link from "next/link";
import { buttonVariants } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

/** Matches mobile's submitted screen: stays put until the tenant moves on. */
export default function SubmittedStep({ apartmentName }: { apartmentName: string | null }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center py-8 text-center md:py-12">
      <NextImage src="/images/house-check.png" alt="" width={160} height={160} className="mb-5" priority />
      <h2 className="font-nunito text-3xl font-bold text-primary">{t("apply.submitted.title")}</h2>
      <p className="mx-auto mt-3 max-w-xl text-base text-foreground">
        {t("apply.submitted.body", {
          name: apartmentName ?? t("apply.submitted.fallbackName"),
        })}
      </p>
      <Link href="/tenant/my-rental" className={`mt-8 cursor-pointer ${buttonVariants({ variant: "primary" })}`}>
        {t("apply.submitted.viewStatus")}
      </Link>
    </div>
  );
}
