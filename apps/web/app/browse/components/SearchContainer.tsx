"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, InputGroup, Spinner } from "@heroui/react";
import { IconMap2, IconSearch } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { BROWSE_HERO_CLASS, BROWSE_SEARCH_ROW_CLASS } from "../lib/browse-layout";

export default function SearchContainer({
  basePath = "/browse",
  filterButton,
  mapHref,
  assistantButton,
  compact = false,
  navigate,
}: {
  basePath?: string;
  filterButton?: React.ReactNode;
  /** Adds a Map button that opens the map search with the current filters. */
  mapHref?: string;
  /** Entry for Ava, the APT Virtual Assistant (tenant Browse only). */
  assistantButton?: React.ReactNode;
  /** Just the search row (no hero banner), for the map search page. */
  compact?: boolean;
  /**
   * Replaces the URL when a search or filter is applied. Defaults to a router
   * replace; the map search passes an in-place history update, because a router
   * navigation remounts the page and would throw away the map and its results.
   */
  navigate?: (href: string) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // No live fetching while typing: the URL (and therefore results) only
  // updates when the user commits via the magnifier button or Enter.
  const handleChange = (value: string) => {
    setSearch(value);
  };

  // Magnifier button / Enter applies the search immediately.
  const handleSearch = () => {
    const current = new URLSearchParams(searchParams.toString());
    const trimmed = search.trim();
    if (trimmed) current.set("search", trimmed);
    else current.delete("search");
    current.delete("page");
    startTransition(() => {
      const href = `${basePath}?${current.toString()}`;
      if (navigate) navigate(href);
      else router.replace(href);
    });
  };

  // Stay in sync when the URL changes elsewhere (e.g. filter-panel Clear All).
  // Skip while the user is typing so remote updates never clobber the draft.
  const urlSearch = searchParams.get("search") ?? "";
  useEffect(() => {
    if (document.activeElement !== inputRef.current && urlSearch !== search) {
      setSearch(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch]);

  // The pill, then the filter entry and (on Browse) the map entry.
  const searchPill = (
    <InputGroup className="flex-1 min-w-0 rounded-full border border-gray-300 transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-muted-foreground">
      <InputGroup.Prefix>
        {isPending ? (
          <Spinner size="sm" color="current" className="text-grey-500" />
        ) : (
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={handleSearch}
            aria-label={t("browse.search.aria")}
            className="h-auto w-auto min-w-0 shrink-0 cursor-pointer p-0 hover:bg-transparent focus-visible:outline-2 focus-visible:outline-primary"
          >
            <IconSearch size={20} className="text-grey-500" />
          </Button>
        )}
      </InputGroup.Prefix>
      <InputGroup.Input
        ref={inputRef}
        placeholder={t("browse.search.placeholder")}
        value={search}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
    </InputGroup>
  );

  // Filters carry over to the map; paging and the previous camera do not.
  const openMap = () => {
    const current = new URLSearchParams(searchParams.toString());
    current.delete("page");
    const query = current.toString();
    router.push(query ? `${mapHref}?${query}` : (mapHref ?? basePath));
  };

  if (compact) {
    return (
      <div className="flex w-full min-w-0 flex-row items-center gap-2">
        {searchPill}
        {filterButton}
      </div>
    );
  }

  return (
    // Below md the hero banner is hidden entirely (mirrors the mobile app,
    // which opens straight into search). md+ keeps the banner.
    <div className={BROWSE_HERO_CLASS}>
      <h2 className="hidden md:block w-full text-2xl sm:text-3xl lg:text-4xl font-medium font-nunito text-white leading-tight text-balance">
        {t("browse.hero.title")}
      </h2>
      <p className="hidden md:block w-full text-white/80 text-xs sm:text-sm px-2 text-balance">
        {t("browse.hero.subtitle")}
      </p>

      {/* Search bar: pill, then the filter and map entries, centered at every
          size. The in-pill magnifier is the search trigger (plus Enter); no
          separate button. */}
      <div className={BROWSE_SEARCH_ROW_CLASS}>
        {searchPill}
        {filterButton}
        {mapHref ? (
          <Button
            isIconOnly
            variant="tertiary"
            size="lg"
            className="shrink-0 cursor-pointer"
            onPress={openMap}
            aria-label={t("browse.searchMap.aria")}
          >
            <IconMap2 size={18} />
          </Button>
        ) : null}
        {assistantButton}
      </div>
    </div>
  );
}
