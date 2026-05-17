"use client";

import type { ReactNode } from "react";
import { Chip } from "@heroui/react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

type StatusChipProps = {
  variant: BadgeVariant;
  children: ReactNode;
};

export default function StatusChip({ variant, children }: StatusChipProps) {
  const colors: Record<BadgeVariant, "success" | "warning" | "danger" | "accent" | "default"> = {
    success: "success",
    warning: "warning",
    danger: "danger",
    info: "accent",
    neutral: "default",
  };

  return (
    <Chip 
      size="sm" 
      variant="soft" 
      color={colors[variant]} 
      className="text-[11px]"
    >
      {children}
    </Chip>
  );
}
