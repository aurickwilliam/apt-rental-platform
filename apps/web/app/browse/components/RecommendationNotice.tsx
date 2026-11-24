"use client";

import Link from "next/link";
import { Button } from "@heroui/react";

interface RecommendationNoticeProps {
  basePath: string;
}

/**
 * Shown when saved preferences are set but "Recommended for You" has nothing to
 * show. The section is never topped up from unrelated listings.
 */
export default function RecommendationNotice({ basePath }: RecommendationNoticeProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="font-semibold">No recommendations right now</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Nothing fits your saved city, budget, household size and smoking choices at the moment. Update your preferences to
        widen the search.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => {
            const url = new URL(window.location.href);
            url.searchParams.set("settings", "open");
            url.searchParams.set("settingsTab", "rental");
            window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
          }}
        >
          Update preferences
        </Button>
        <Link
          href={`${basePath}?sort=recent`}
          className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-primary"
        >
          Browse all apartments
        </Link>
      </div>
    </div>
  );
}
