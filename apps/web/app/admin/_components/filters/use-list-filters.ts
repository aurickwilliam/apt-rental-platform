"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { buildListHref } from "@/lib/admin-filters";

const SEARCH_DEBOUNCE_MS = 350;

type ParamValue = string | string[] | number | null | undefined;

interface ListView<F> {
  filters: F;
  page: number;
}

interface NavigateOptions {
  /** Replace the history entry instead of pushing (used for typed search). */
  replace?: boolean;
  /** Scroll to the top after navigating; filter changes keep position. */
  scroll?: boolean;
}

interface UseListFiltersOptions<F extends { q: string }> {
  pathname: string;
  filters: F;
  page: number;
  toParams: (filters: F, page: number) => Record<string, ParamValue>;
}

/**
 * URL-backed filter state for the admin list pages. Applied changes show
 * immediately (optimistic) while the server renders the new results, search
 * applies as the user types (debounced), and the local search text follows
 * back/forward navigation without clobbering what the user is typing.
 */
export function useListFilters<F extends { q: string }>({
  pathname,
  filters,
  page,
  toParams,
}: UseListFiltersOptions<F>) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [view, setOptimisticView] = useOptimistic<ListView<F>>({
    filters,
    page,
  });
  const [search, setSearch] = useState(filters.q);
  const [syncedQuery, setSyncedQuery] = useState(filters.q);
  const [requestedQuery, setRequestedQuery] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The URL's search term changed without this page asking for it (back /
  // forward, a link): mirror it. Skipped mid-navigation so an older response
  // can't overwrite newer typing.
  if (!isPending && filters.q !== syncedQuery) {
    setSyncedQuery(filters.q);
    if (filters.q !== requestedQuery) setSearch(filters.q);
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function cancelPendingSearch() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
  }

  function navigate(
    nextFilters: F,
    nextPage = 1,
    { replace = false, scroll = false }: NavigateOptions = {},
  ) {
    cancelPendingSearch();
    setRequestedQuery(nextFilters.q.trim());
    const href = buildListHref(pathname, toParams(nextFilters, nextPage));
    startTransition(() => {
      setOptimisticView({ filters: nextFilters, page: nextPage });
      if (replace) router.replace(href, { scroll });
      else router.push(href, { scroll });
    });
  }

  /** Applies filter changes (keeping the typed search) and resets to page 1. */
  function apply(patch: Partial<F>) {
    navigate({ ...view.filters, q: search, ...patch });
  }

  function changeSearch(value: string) {
    setSearch(value);
    cancelPendingSearch();
    debounceRef.current = setTimeout(() => {
      if (value.trim() !== view.filters.q.trim())
        navigate({ ...view.filters, q: value }, 1, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
  }

  function submitSearch() {
    navigate({ ...view.filters, q: search });
  }

  function clearSearch() {
    setSearch("");
    navigate({ ...view.filters, q: "" });
  }

  function goToPage(nextPage: number) {
    navigate(view.filters, nextPage, { scroll: true });
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return {
    filters: view.filters,
    page: view.page,
    isPending,
    search,
    changeSearch,
    submitSearch,
    clearSearch,
    apply,
    goToPage,
    refresh,
  };
}
