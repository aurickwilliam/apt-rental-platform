"use client";

import { Switch } from "@heroui/react";

interface ToggleSwitchProps {
  isSelected: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export default function ToggleSwitch({
  isSelected,
  onValueChange,
  disabled,
  "aria-label": ariaLabel,
}: ToggleSwitchProps) {
  return (
    <Switch
      isSelected={isSelected}
      onChange={onValueChange}
      isDisabled={disabled}
      aria-label={ariaLabel}
      className="[--switch-control-bg-checked:var(--primary)]"
    >
      <Switch.Content className="flex items-center gap-2">
        <Switch.Control className="shadow-none border-2">
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}