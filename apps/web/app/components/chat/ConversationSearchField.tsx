"use client";

import { useRef, useState } from "react";
import { Button, InputGroup } from "@heroui/react";
import { IconHistory, IconSearch, IconX } from "@tabler/icons-react";

interface ConversationSearchFieldProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Recent search terms, newest first. */
  recent: string[];
  /** Records a term as the newest recent search. */
  onRemember: (term: string) => void;
  onClearRecent: () => void;
  placeholder?: string;
}

/**
 * Search box for a Messages list: a search icon, a Clear button while it has
 * text, and a card of recent searches under the focused, empty box (the same
 * pattern as Browse). Filtering itself happens in the list, as the user types.
 */
export default function ConversationSearchField({
  query,
  onQueryChange,
  recent,
  onRemember,
  onClearRecent,
  placeholder = "Search by name or apartment",
}: ConversationSearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Focus anywhere in the wrapper (box or recent card) keeps the card open, so
  // keyboard users can Tab into it; Escape closes it.
  const [isFocused, setIsFocused] = useState(false);
  const showRecent = isFocused && query.trim() === "" && recent.length > 0;

  return (
    <div
      className="relative"
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
          <IconSearch size={18} aria-hidden="true" className="text-grey-500" />
        </InputGroup.Prefix>
        <InputGroup.Input
          ref={inputRef}
          type="search"
          aria-label="Search conversations"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRemember(query);
          }}
          className="[&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <InputGroup.Suffix>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              onPress={() => {
                onQueryChange("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="h-auto w-auto min-w-0 shrink-0 cursor-pointer p-0 hover:bg-transparent focus-visible:outline-2 focus-visible:outline-primary"
            >
              <IconX size={16} className="text-grey-500" />
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
              onPress={onClearRecent}
              className="h-auto min-w-0 cursor-pointer p-0 text-sm font-semibold text-[#376BF5] hover:bg-transparent hover:underline"
            >
              Clear
            </Button>
          </div>
          <ul className="py-1">
            {recent.map((term) => (
              <li key={term}>
                <Button
                  variant="ghost"
                  onPress={() => {
                    onQueryChange(term);
                    onRemember(term);
                    inputRef.current?.focus();
                  }}
                  className="h-auto w-full cursor-pointer justify-start gap-3 rounded-none px-4 py-2 text-left font-normal"
                >
                  <IconHistory size={18} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate text-sm text-foreground">{term}</span>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
