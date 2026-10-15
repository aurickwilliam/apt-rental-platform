"use client";

import type { ReactNode } from "react";
import { Chip } from "@heroui/react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

type StatusChipProps = {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
  /** Solid fill with dark text, for chips placed on colored backgrounds. */
  solid?: boolean;
};

const solidColors: Record<BadgeVariant, string> = {
  success: "bg-green-200! text-green-900!",
  warning: "bg-amber-200! text-amber-950!",
  danger: "bg-red-200! text-red-900!",
  info: "bg-sky-200! text-sky-900!",
  neutral: "bg-white/85! text-slate-800!",
};

export default function StatusChip({ variant, children, className = "", solid = false }: StatusChipProps) {
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
      className={`font-nunito text-[11px] font-semibold ${solid ? solidColors[variant] : ""} ${className}`}
    >
      {children}
    </Chip>
  );
}
