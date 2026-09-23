"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface QuickActionButtonProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onPress?: () => void;
  badgeCount?: number;
}

function formatBadgeCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

export default function QuickActionButton({
  title,
  subtitle,
  icon: Icon,
  onPress,
  badgeCount,
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex flex-1 items-center gap-3 rounded-2xl bg-card px-4 py-3 text-left transition-colors hover:bg-muted/60"
    >
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted">
        <Icon size={22} className="text-muted-foreground" strokeWidth={2} />
        {(badgeCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1">
            <span className="text-[10px] font-semibold text-white">
              {formatBadgeCount(badgeCount ?? 0)}
            </span>
          </span>
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-sm font-semibold text-card-foreground">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
    </button>
  );
}
