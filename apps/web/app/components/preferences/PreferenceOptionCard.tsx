"use client";

import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";

interface PreferenceOptionCardProps {
  selected: boolean;
  onPress: () => void;
  label: string;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
}

/**
 * Selectable option card shared by the personalization steps and the rental
 * application (cities, budgets, bedrooms, household, vehicles, Yes/No).
 * Native button semantics keep keyboard interaction free.
 */
export default function PreferenceOptionCard({
  selected,
  onPress,
  label,
  icon,
  compact = false,
  className = "",
}: PreferenceOptionCardProps) {
  return (
    <Button
      variant="ghost"
      aria-pressed={selected}
      onClick={onPress}
      className={`button--bare flex ${compact ? "min-h-12 p-3" : "min-h-16 p-4"} items-center gap-3 rounded-xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/40"
      } ${className}`}
    >
      {icon && (
        <span className="shrink-0 text-primary" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary text-white" : "border-border text-transparent"
        }`}
      >
        <IconCheck size={13} />
      </span>
    </Button>
  );
}
