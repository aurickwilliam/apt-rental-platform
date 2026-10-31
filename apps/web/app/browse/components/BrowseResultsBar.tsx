"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { FILTER_KEYS } from "../lib/browse-params";

type Props = {
  resultCount: number;
  basePath?: string;
};

// Result count above the grid, with a Clear shortcut while filters are
// applied. The filters themselves live in the drawer behind the search row's
// filter button (FilterDrawerButton).
export default function BrowseResultsBar({ resultCount, basePath = "/browse" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const activeCount = useMemo(() => {
    let count = 0;
    for (const key of FILTER_KEYS) {
      if (searchParams.get(key)) count += 1;
    }
    return count;
  }, [searchParams]);

  // Drops filters and text search, like the drawer's Clear All.
  const clearAll = () => {
    router.replace(basePath);
  };

  return (
    <div className="mb-3 flex min-h-8 items-center justify-between gap-2">
      <p className="shrink-0 text-sm text-default-500" aria-live="polite">
        {resultCount === 1 ? t("browse.results.one") : t("browse.results.other", { count: resultCount })}
      </p>
      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-danger"
          onPress={clearAll}
          aria-label={t("browse.clearAllFilters.aria")}
        >
          {t("browse.clear")}
        </Button>
      )}
    </div>
  );
}
