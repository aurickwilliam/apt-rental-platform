"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, InputGroup, Spinner } from "@heroui/react";
import { Search } from "lucide-react";

import { useDebouncedCallback } from "./use-debounced-callback";

const SEARCH_DEBOUNCE_MS = 300;

export default function SearchContainer() {
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
      router.replace(`/browse?${current.toString()}`);
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
    <div className="w-full h-52 bg-primary rounded-xl flex items-center justify-center flex-col gap-3">
      <h2 className="text-4xl font-medium font-dm-serif text-white">
        Find your Perfect Apartment!
      </h2>
      <p className="text-white/80 text-sm">
        Browse verified listings across Caloocan, Malabon, Navotas, and Valenzuela
      </p>

      {/* Search bar */}
      <div className="flex items-center gap-2 w-full max-w-lg mt-2">
        <InputGroup className="w-full rounded-full border border-gray-300 bg-white transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-gray-400">
          <InputGroup.Prefix>
            {isPending ? (
              <Spinner size="sm" color="current" className="text-grey-500" />
            ) : (
              <Search size={20} className="text-grey-500" />
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

        <Button
          variant="secondary"
          size="lg"
          onPress={handleSearch}
        >
          Search
        </Button>
      </div>
    </div>
  );
}
