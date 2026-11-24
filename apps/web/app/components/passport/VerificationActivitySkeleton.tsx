"use client";

import { Skeleton } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

/**
 * Matches the verification activity block while the latest submission
 * streams in. The profile card itself is already interactive; this only
 * stands in for the independent timeline beneath it.
 */
export default function VerificationActivitySkeleton() {
  const { t } = useTranslation();

  return (
    <div aria-busy="true" aria-label={t("passport.activity.loading")}>
      <div className="border-t border-border" aria-hidden="true" />
      <Skeleton className="mt-4 h-4 w-40 rounded-md bg-skeleton!" />
      <div className="mt-3 flex flex-col gap-4">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="flex gap-3">
            <Skeleton className="size-5 shrink-0 rounded-full bg-skeleton!" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-32 rounded-md bg-skeleton!" />
              <Skeleton className="h-3 w-24 rounded-md bg-skeleton!" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
