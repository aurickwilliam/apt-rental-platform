"use client";

import { useSearchParams } from "next/navigation";

import { isDefaultBrowseParams } from "../lib/browse-params";
import BrowsePageSkeleton, { BrowseResultsPageSkeleton } from "./BrowsePageSkeleton";

// Route loading state for /browse and /tenant/browse. Search, filters and
// paging all load through here too, so pick the layout that matches what the
// URL will render instead of always showing the curated discovery rows.
export default function BrowseLoadingSkeleton({ fullWidth = false }: { fullWidth?: boolean }) {
  const searchParams = useSearchParams();

  return isDefaultBrowseParams(Object.fromEntries(searchParams)) ? (
    <BrowsePageSkeleton fullWidth={fullWidth} />
  ) : (
    <BrowseResultsPageSkeleton fullWidth={fullWidth} />
  );
}
