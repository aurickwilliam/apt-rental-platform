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
          className="w-full justify-between px-4 py-3 h-auto"
        >
          <span className="text-left flex-1 font-inter text-sm text-foreground truncate">
            {value || placeholder || "Select"}
          </span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="bottom" className="w-(--trigger-width) p-0">
        <Popover.Dialog className="p-2 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          <ListBox selectionMode="single" selectedKeys={[value]} onSelectionChange={(keys) => onChange(Array.from(keys)[0] as string)}>
            {options.map((opt) => (
              <ListBox.Item key={opt} value={opt}>
                {opt}
              </ListBox.Item>
            ))}
          </ListBox>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}