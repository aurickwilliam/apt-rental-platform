"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, InputGroup, Spinner } from "@heroui/react";
import { IconSearch } from "@tabler/icons-react";

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
      router.replace(`${basePath}?${current.toString()}`);
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

      {/* Search bar: pill + filter right on mobile (filter entry is
          mobile-only, md:hidden); centered pill on desktop. The in-pill
          magnifier is the search trigger (plus Enter); no separate button. */}
      <div className="flex flex-row items-center gap-2 w-full max-w-xl mt-2 mx-auto min-w-0">
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
        </InputGroup>

        {filterButton}
      </div>
    </div>
  );
}
