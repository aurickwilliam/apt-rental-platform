"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, InputGroup, Spinner } from "@heroui/react";
import Image from "next/image";
import {
  IconArrowRight,
  IconMap2,
  IconPhoto,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { CAMANAVA_CITIES } from "@repo/constants";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import {
  useRecentApartmentSearches,
  useRememberRecentApartment,
} from "@/hooks/use-recent-apartment-searches";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import { recentApartmentHref } from "@/lib/recent-apartment-searches";
import {
  BROWSE_HEADER_CLASS,
  BROWSE_SEARCH_BAR_CLASS,
} from "../lib/browse-layout";
import CityChips from "./CityChips";

export default function SearchContainer({
  basePath = "/browse",
  filterButton,
  mapHref,
  assistantButton,
  compact = false,
  navigate,
  hasFilterRail = false,
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
  /** The filters sit beside the results from md up, so the bar's filter button is for phones only. */
  hasFilterRail?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
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

  // City chips write the drawer's `locations` filter: one city, or none for all
  // cities. Choosing the current city again clears it. Paging resets.
  const locations = searchParams.get("locations") ?? "";
  const selectedCity = (CAMANAVA_CITIES as readonly string[]).includes(
    locations,
  )
    ? locations
    : null;
  // The chip highlights at once while the URL (and the results) catch up.
  const [shownCity, setShownCity] = useOptimistic(selectedCity);
  const handleSelectCity = (city: string | null) => {
    const next = city && city !== selectedCity ? city : null;
    const current = new URLSearchParams(searchParams.toString());
    if (next) current.set("locations", next);
    else current.delete("locations");
    current.delete("page");
    startTransition(() => {
      setShownCity(next);
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

  // Focus anywhere in the bar (box, actions or recent card) keeps the recent
  // card open, so keyboard users can Tab into it; Escape closes it.
  const focusProps = {
    onFocus: () => setIsFocused(true),
    onBlur: (e: React.FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setIsFocused(false);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === "Escape") setIsFocused(false);
    },
  };

  // The text field. Embedded in the header bar it is borderless (the bar owns
  // the border and focus ring) and the magnifier is decorative: the arrow
  // button at the bar's end is the search trigger, plus Enter.
  const renderInput = (embedded: boolean) => (
    <InputGroup
      className={
        embedded
          ? "min-w-0 flex-1 rounded-full border-0 bg-transparent shadow-none ring-0 focus-within:ring-0 [&_input::placeholder]:text-muted-foreground"
          : "w-full rounded-full border border-gray-300 transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-muted-foreground"
      }
    >
      <InputGroup.Prefix>
        {embedded ? (
          <IconSearch size={20} className="text-grey-500" aria-hidden="true" />
        ) : isPending ? (
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
        className="min-w-0 text-ellipsis"
        placeholder={t("browse.search.placeholder")}
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
  );

  // mousedown is prevented so pressing the card never moves focus off the box.
  const recentCard = (
    <>
      {showRecent ? (
        // mousedown is prevented so pressing the card never moves focus off the box.
        <div
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface text-left text-foreground shadow-lg"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between px-4 pt-3">
            <span className="text-sm font-semibold text-muted-foreground">
              Recent searches
            </span>
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
                        unoptimized={
                          !canOptimizePublicApartmentImage(item.thumbnailUrl)
                        }
                      />
                    ) : (
                      <IconPhoto size={22} className="text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {item.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.location}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );

  // Compact (map search): the pill with the filter entry beside it.
  const searchPill = (
    <div className="relative min-w-0 flex-1" {...focusProps}>
      {renderInput(false)}
      {recentCard}
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
    <div className={BROWSE_HEADER_CLASS}>
      <div className="hidden md:block">
        <h2 className="font-nunito text-2xl font-semibold leading-tight text-balance text-primary sm:text-3xl">
          {t("browse.hero.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("browse.hero.subtitle")}
        </p>
      </div>

      {/* One bar: the field, then the filter, map and Ava entries as quiet icons
          behind a divider, and the search button as the only filled control. */}
      <div className={BROWSE_SEARCH_BAR_CLASS} {...focusProps}>
        {renderInput(true)}
        <span
          aria-hidden="true"
          className="mx-1 h-6 w-px shrink-0 bg-gray-300"
        />
        <div className="flex shrink-0 items-center">
          {hasFilterRail ? <div className="md:hidden">{filterButton}</div> : filterButton}
          {mapHref ? (
            <Button
              isIconOnly
              variant="ghost"
              size="md"
              className="shrink-0 cursor-pointer"
              onPress={openMap}
              aria-label="Search on the map"
            >
              <IconMap2 size={18} />
            </Button>
          ) : null}
          {assistantButton}
        </div>
        <Button
          isIconOnly
          size="md"
          className="ml-1 shrink-0 cursor-pointer rounded-full"
          onPress={handleSearch}
          aria-label="Search"
        >
          {isPending ? (
            <Spinner size="sm" color="current" />
          ) : (
            <IconArrowRight size={18} />
          )}
        </Button>
        {recentCard}
      </div>

      <CityChips
        selected={shownCity}
        isCustom={
          shownCity === selectedCity &&
          locations !== "" &&
          selectedCity === null
        }
        onSelect={handleSelectCity}
      />
    </div>
  );
}
