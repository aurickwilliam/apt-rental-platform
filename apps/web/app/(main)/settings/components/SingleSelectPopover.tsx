"use client";

import { ChevronDown } from "lucide-react";
import { Button, Popover, ListBox } from "@heroui/react";

interface SingleSelectPopoverProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

export function SingleSelectPopover({
  value,
  onChange,
  options,
  placeholder,
}: SingleSelectPopoverProps) {
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
              {value || placeholder || "Select"}
            </span>
            <span
              aria-hidden="true"
              className="invisible col-start-1 row-start-1 h-0 overflow-hidden whitespace-nowrap"
            >
              {placeholder ?? "Select"}
            </span>
          </span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="bottom" className="w-56 max-w-[calc(100vw-2rem)] p-0">
        <Popover.Dialog className="p-2 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          <ListBox selectionMode="single" selectedKeys={[value]} onSelectionChange={(keys) => onChange(Array.from(keys)[0] as string)}>
            {options.map((opt) => (
              <ListBox.Item key={opt} id={opt} textValue={opt}>
                {opt}
              </ListBox.Item>
            ))}
          </ListBox>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}