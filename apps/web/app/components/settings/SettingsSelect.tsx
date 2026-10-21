"use client";

import { ListBox, Select } from "@heroui/react";

export interface SettingsSelectOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
}

interface SettingsSelectProps {
  label: string;
  value: string;
  options: readonly SettingsSelectOption[];
  onChange: (value: string) => void;
  /** Shown while `value` is empty or matches no option. */
  placeholder?: string;
  /** Marks the field invalid: a red border, announced to assistive tech. */
  isInvalid?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export default function SettingsSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  isInvalid,
  isDisabled,
  className = "w-40",
}: SettingsSelectProps) {
  return (
    <Select
      aria-label={label}
      value={value || null}
      placeholder={placeholder}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      onChange={(key) => {
        if (key) onChange(String(key));
      }}
      className={`group ${className}`}
    >
      <Select.Trigger className="cursor-pointer border-border bg-background! text-foreground hover:bg-muted! group-data-[invalid=true]:border-destructive!">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox className="settings-select-list">
          {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
            <ListBox.Item key={optionValue} id={optionValue} textValue={optionLabel}>
              <span className="flex flex-row items-center gap-2">
                {Icon ? <Icon size={16} aria-hidden /> : null}
                {optionLabel}
              </span>
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
