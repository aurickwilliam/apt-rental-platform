"use client";

import { IconArrowsSort } from "@tabler/icons-react";
import { Button, Dropdown, Label } from "@heroui/react";
import type { SortOption } from "@/lib/admin-filters";

interface SortDropdownProps<T extends string> {
  options: readonly SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function SortDropdown<T extends string>({
  options,
  value,
  onChange,
}: SortDropdownProps<T>) {
  const current = options.find((option) => option.id === value);

  return (
    <Dropdown>
      <Button
        variant="tertiary"
        className="cursor-pointer"
        aria-label={`Sort by ${current?.label ?? "default"}`}
      >
        <IconArrowsSort size={18} aria-hidden="true" />
        <span className="hidden sm:inline">{current?.label ?? "Sort"}</span>
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-56">
        <Dropdown.Menu
          aria-label="Sort by"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([value])}
          onSelectionChange={(keys) => {
            if (keys === "all") return;
            const [next] = Array.from(keys);
            if (next !== undefined && next !== value) onChange(next as T);
          }}
        >
          {options.map((option) => (
            <Dropdown.Item
              key={option.id}
              id={option.id}
              textValue={option.label}
              className="cursor-pointer"
            >
              <Dropdown.ItemIndicator />
              <Label>{option.label}</Label>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
