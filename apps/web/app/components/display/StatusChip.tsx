"use client";

import type { CSSProperties, ReactNode } from "react";
import { Chip } from "@heroui/react";
import { STATUS_COLORS } from "@repo/constants";
import type { StatusTone } from "@/lib/status-tone";

interface StatusChipProps {
  tone: StatusTone;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
}

// Status chip with the same opaque, bordered, theme-aware colors as mobile's
// statusChipSurface. Icons inside use the label color (currentColor).
export default function StatusChip({ tone, size = "sm", className, children }: StatusChipProps) {
  const light = STATUS_COLORS.light[tone];
  const dark = STATUS_COLORS.dark[tone];
  const style = {
    "--status-bg": light.backgroundColor,
    "--status-fg": light.textColor,
    "--status-border": light.borderColor,
    "--status-bg-dark": dark.backgroundColor,
    "--status-fg-dark": dark.textColor,
    "--status-border-dark": dark.borderColor,
  } as CSSProperties;

  return (
    <Chip
      size={size}
      variant="soft"
      color="default"
      style={style}
      className={`status-chip ${className ?? ""}`}
    >
      {children}
    </Chip>
  );
}
