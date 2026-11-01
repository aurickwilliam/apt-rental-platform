"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, InputGroup, Spinner } from "@heroui/react";
import Image from "next/image";
import { IconMap2, IconPhoto, IconSearch, IconX } from "@tabler/icons-react";

import { useRecentApartmentSearches, useRememberRecentApartment } from "@/hooks/use-recent-apartment-searches";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import { recentApartmentHref } from "@/lib/recent-apartment-searches";
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
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  // Focus anywhere in the pill wrapper (box or recent card) keeps the card open,
  // so keyboard users can Tab into it; Escape closes it.
  const [isFocused, setIsFocused] = useState(false);
  const { recent, clear: clearRecent } = useRecentApartmentSearches(isFocused);
  const rememberRecentApartment = useRememberRecentApartment();
  const showRecent = isFocused && search.trim() === "" && recent.length > 0;

  // Clears the box and the applied search, then keeps the caret in the box.
  const handleClearSearch = () => {
    setSearch("");
    if (searchParams.get("search")) {
      const current = new URLSearchParams(searchParams.toString());
      current.delete("search");
      current.delete("page");
      startTransition(() => {
        const href = `${basePath}?${current.toString()}`;
        if (navigate) navigate(href);
        else router.replace(href);
      });
    }
    inputRef.current?.focus();
  };

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
    <div
      className="relative min-w-0 flex-1"
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setIsFocused(false);
      }}
    >
      <InputGroup className="w-full rounded-full border border-gray-300 transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-muted-foreground">
        <InputGroup.Prefix>
          {isPending ? (
            <Spinner size="sm" color="current" className="text-grey-500" />
          ) : (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={handleSearch}
              aria-label="Search"
              className="h-auto w-auto min-w-0 shrink-0 cursor-pointer p-0 hover:bg-transparent focus-visible:outline-2 focus-visible:outline-primary"
            >
              <IconSearch size={20} className="text-grey-500" />
            </Button>
          )}
        </InputGroup.Prefix>
        <InputGroup.Input
          ref={inputRef}
          placeholder="Search by name or location..."
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        {search ? (
          <InputGroup.Suffix>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={handleClearSearch}
              aria-label="Clear search"
              className="h-auto w-auto min-w-0 shrink-0 cursor-pointer p-0 hover:bg-transparent focus-visible:outline-2 focus-visible:outline-primary"
            >
              <IconX size={18} className="text-grey-500" />
            </Button>
          </InputGroup.Suffix>
        ) : null}
      </InputGroup>

      {showRecent ? (
        // mousedown is prevented so pressing the card never moves focus off the box.
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface text-left text-foreground shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between px-4 pt-3">
            <span className="text-sm font-semibold text-muted-foreground">Recent searches</span>
            <Button
              variant="ghost"
              size="sm"
              onPress={clearRecent}
              className="h-auto min-w-0 cursor-pointer p-0 text-sm font-semibold text-[#376BF5] hover:bg-transparent hover:underline"
            >
              Clear
            </Button>
          </div>
          <ul className="py-1">
            {recent.map((item) => (
              <li key={item.id}>
                <Button
                  variant="ghost"
                  onPress={() => {
                    rememberRecentApartment({
                      id: item.id,
                      name: item.name,
                      location: item.location,
                      image: item.thumbnailUrl,
                    });
                    setIsFocused(false);
                    router.push(recentApartmentHref(basePath, item.id));
                  }}
                  className="h-auto w-full cursor-pointer justify-start gap-3 rounded-none px-4 py-2 text-left font-normal"
                >
                  <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-default">
                    {item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                        unoptimized={!canOptimizePublicApartmentImage(item.thumbnailUrl)}
                      />
                    ) : (
                      <IconPhoto size={22} className="text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {item.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{item.location}</span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
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
        Find your Perfect Apartment!
      </h2>
      <p className="hidden md:block w-full text-white/80 text-xs sm:text-sm px-2 text-balance">
        Browse verified listings across Caloocan, Malabon, Navotas, and Valenzuela
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
            aria-label="Search on the map"
          >
            <IconMap2 size={18} />
          </Button>
        ) : null}
        {assistantButton}
      </div>
    </div>
  );
}
