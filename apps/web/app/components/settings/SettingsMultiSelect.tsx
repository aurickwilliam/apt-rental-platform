"use client";

import { ListBox, Select } from "@heroui/react";

import type { SettingsSelectOption } from "./SettingsSelect";

interface SettingsMultiSelectProps {
  label: string;
  value: readonly string[];
  options: readonly SettingsSelectOption[];
  onChange: (value: string[]) => void;
  /** Shown while nothing is selected. */
  placeholder?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  className?: string;
}

// Multiple-choice sibling of SettingsSelect, same trigger and list styling.
export default function SettingsMultiSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  isInvalid,
  isDisabled,
  className = "w-40",
}: SettingsMultiSelectProps) {
  return (
    <Select
      aria-label={label}
      selectionMode="multiple"
      value={[...value]}
      placeholder={placeholder}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      onChange={(keys) => {
        const picked = keys.map(String);
        // Keep the options' order so the saved list never depends on click order.
        onChange(options.map((option) => option.value).filter((v) => picked.includes(v)));
      }}
      className={`group ${className}`}
    >
      <Select.Trigger className="cursor-pointer border-border bg-card! text-foreground hover:bg-muted! group-data-[invalid=true]:border-destructive!">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox className="settings-select-list" selectionMode="multiple">
          {options.map(({ value: optionValue, label: optionLabel }) => (
            <ListBox.Item key={optionValue} id={optionValue} textValue={optionLabel}>
              {optionLabel}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
