"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button, Input, Popover, ListBox } from "@heroui/react";

interface MultiSelectPopoverProps {
  value: readonly string[];
  onChange?: (value: string[]) => void;
  onToggle?: (option: string) => void;
  options: readonly string[];
  placeholder?: string;
  renderItem?: (option: string) => React.ReactNode;
}

export function MultiSelectPopover({
  value,
  onChange,
  onToggle,
  options,
  placeholder,
  renderItem,
}: MultiSelectPopoverProps) {
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  // ListBox reports the full next selection — fan out to the caller's API.
  const handleSelectionChange = (keys: Set<string> | "all") => {
    const next = keys === "all" ? [...options] : Array.from(keys);
    if (onToggle) {
      const prev = new Set(value);
      const nextSet = new Set(next);
      for (const opt of new Set([...prev, ...nextSet])) {
        if (prev.has(opt) !== nextSet.has(opt)) onToggle(opt);
      }
    } else if (onChange) {
      onChange(next);
    }
  };

  const displayValue = value.length === 0
    ? placeholder
    : value.join(", ");

  return (
    <Popover>
      <Popover.Trigger>
        <Button
          variant="outline"
          className="w-full max-w-full justify-between px-4 py-3 h-auto"
        >
          {/* Grid stack: the cell sizes to the widest child, flooring the
              trigger at the placeholder width without adding phantom space. */}
          <span className="grid flex-1 min-w-0 text-left font-inter text-sm">
            <span className="col-start-1 row-start-1 truncate text-foreground">
              {displayValue}
            </span>
            <span
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 h-0 overflow-hidden whitespace-nowrap"
            >
              {placeholder ?? ""}
            </span>
          </span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </Button>
      </Popover.Trigger>

      <Popover.Content placement="bottom" className="w-56 max-w-[calc(100vw-2rem)] p-0">
        <Popover.Dialog className="flex flex-col gap-2 p-3 bg-popover border border-border rounded-xl shadow-lg">
          <div className="relative rounded-xl bg-popover">
            <Input
              autoFocus
              placeholder="Search..."
              aria-label="Search options"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent placeholder:text-muted-foreground pl-10 pr-4 py-3"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          </div>

          <div className="max-h-60 overflow-y-auto overflow-x-hidden w-full pr-1">
            <ListBox
              selectionMode="multiple"
              selectedKeys={value}
              onSelectionChange={(keys) =>
                handleSelectionChange(keys === "all" ? "all" : new Set(Array.from(keys, String)))
              }
            >
              {filtered.map((option) => (
                <ListBox.Item key={option} id={option} textValue={option}>
                  {renderItem ? renderItem(option) : <span className="font-inter text-sm">{option}</span>}
                </ListBox.Item>
              ))}
            </ListBox>
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No results</p>
            )}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}