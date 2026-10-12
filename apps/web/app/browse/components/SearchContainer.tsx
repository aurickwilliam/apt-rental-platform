"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, InputGroup, Spinner } from "@heroui/react";
import { IconSearch } from "@tabler/icons-react";

import { useDebouncedCallback } from "./use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchContainer({
  basePath = "/browse",
  filterButton,
}: {
  basePath?: string;
  filterButton?: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const pushSearch = (value: string) => {
    const current = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) current.set("search", trimmed);
    else current.delete("search");
    current.delete("page");
    startTransition(() => {
      router.replace(`${basePath}?${current.toString()}`);
    });
  };

  const { debounced, flush } = useDebouncedCallback(
    pushSearch,
    SEARCH_DEBOUNCE_MS,
  );

  // Live filtering (debounced) as the user types.
  const handleChange = (value: string) => {
    setSearch(value);
    debounced(value);
  };

  // Search button / Enter applies immediately.
  const handleSearch = () => {
    flush(search);
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

  return (
    // Below md the hero banner is hidden entirely (mirrors the mobile app,
    // which opens straight into search). md+ keeps the banner.
    <div className="w-full min-w-0 md:min-h-52 bg-primary rounded-xl flex items-stretch justify-center flex-col gap-2 sm:gap-3 px-3 md:px-4 py-3 md:py-10 md:text-center">
      <h2 className="hidden md:block w-full text-2xl sm:text-3xl lg:text-4xl font-medium font-nunito text-white leading-tight text-balance">
        Find your Perfect Apartment!
      </h2>
      <p className="hidden md:block w-full text-white/80 text-xs sm:text-sm px-2 text-balance">
        Browse verified listings across Caloocan, Malabon, Navotas, and Valenzuela
      </p>

      {/* Search bar: one row on all sizes — compact Search left, pill
          center, filter entry right (mobile only). */}
      <div className="flex flex-row items-center gap-2 w-full max-w-lg mt-2 mx-auto min-w-0">
        <Button
          variant="secondary"
          size="lg"
          className="order-first shrink-0 sm:order-last sm:w-auto"
          onPress={handleSearch}
          aria-label="Search"
        >
          <IconSearch size={18} />
          <span className="hidden sm:inline">Search</span>
        </Button>

        <InputGroup className="flex-1 min-w-0 rounded-full border border-gray-300 bg-white transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-gray-400">
          <InputGroup.Prefix>
            {isPending ? (
              <Spinner size="sm" color="current" className="text-grey-500" />
            ) : (
              <IconSearch size={20} className="text-grey-500" />
            )}
          </InputGroup.Prefix>
          <InputGroup.Input
            ref={inputRef}
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </InputGroup>

        {filterButton}
      </div>
    </div>
  );
}
