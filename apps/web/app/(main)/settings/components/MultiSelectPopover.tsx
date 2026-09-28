"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button, Input, Popover, Checkbox } from "@heroui/react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (onToggle) {
      onToggle(option);
    } else if (onChange) {
      if (value.includes(option)) {
        onChange(value.filter((v) => v !== option));
      } else {
        onChange([...value, option]);
      }
    }
  };

  const displayValue = value.length === 0
    ? placeholder
    : value.join(", ");

  return (
    <Popover onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Button
          variant="outline"
          className="w-full justify-between px-4 py-3 h-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-left flex-1 font-inter text-sm text-foreground truncate">
            {displayValue}
          </span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </Button>
      </Popover.Trigger>

      <Popover.Content placement="bottom" className="w-(--trigger-width) p-0">
        <Popover.Dialog className="flex flex-col gap-2 p-3 bg-popover border border-border rounded-xl shadow-lg">
          <div className="relative rounded-xl border border-border bg-popover">
            <Input
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent placeholder:text-muted-foreground pl-10 pr-4 py-3"
            />
            <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto overflow-x-hidden w-full pr-1">
            {filtered.map((option) => (
              <label key={option} className="flex items-center gap-2 px-4 py-3 hover:bg-primary/5 rounded-lg cursor-pointer">
                <Checkbox
                  isSelected={value.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 text-primary"
                />
                {renderItem ? renderItem(option) : <span className="font-inter text-sm">{option}</span>}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No results</p>
            )}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}