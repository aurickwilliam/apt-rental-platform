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
  isDisabled?: boolean;
  className?: string;
}

export default function SettingsSelect({
  label,
  value,
  options,
  onChange,
  isDisabled,
  className = "w-40",
}: SettingsSelectProps) {
  return (
    <Select
      aria-label={label}
      value={value}
      isDisabled={isDisabled}
      onChange={(key) => {
        if (key) onChange(String(key));
      }}
      className={className}
    >
      <Select.Trigger className="cursor-pointer border-border bg-background! text-foreground hover:bg-muted!">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
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
