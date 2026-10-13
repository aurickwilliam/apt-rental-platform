"use client";

import type { FormEvent, ReactNode } from "react";
import { IconRefresh } from "@tabler/icons-react";
import { Button, Label, SearchField } from "@heroui/react";

interface AdminFilterToolbarProps {
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  refreshLabel: string;
  onRefresh: () => void;
  /** Right-side actions, e.g. the filters popover and sort dropdown. */
  children: ReactNode;
}

export default function AdminFilterToolbar({
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onSearchClear,
  refreshLabel,
  onRefresh,
  children,
}: AdminFilterToolbarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchSubmit();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-3 sm:w-auto"
      >
        <SearchField
          name="q"
          value={searchValue}
          onChange={onSearchChange}
          onClear={onSearchClear}
          className="min-w-0 flex-1 sm:w-80 sm:flex-none"
        >
          <Label className="sr-only">{searchLabel}</Label>
          <SearchField.Group className="border border-border bg-card shadow-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <SearchField.SearchIcon className="text-muted-foreground" />
            <SearchField.Input placeholder={searchPlaceholder} />
            <SearchField.ClearButton className="cursor-pointer text-white" />
          </SearchField.Group>
        </SearchField>
        <Button
          isIconOnly
          variant="tertiary"
          aria-label={refreshLabel}
          onPress={onRefresh}
          className="cursor-pointer"
        >
          <IconRefresh size={18} aria-hidden="true" />
        </Button>
      </form>

      <div className="flex items-center gap-2 sm:ml-auto">{children}</div>
    </div>
  );
}
