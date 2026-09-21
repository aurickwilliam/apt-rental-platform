"use client";

import type { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
  badgeCount?: number;
}

function formatBadgeCount(count: number): string {
  return count > 9 ? "9+" : String(count);
}

export default function QuickActionButton({
  label,
  icon: Icon,
  onPress,
  badgeCount,
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="flex w-1/4 flex-col items-center justify-start gap-2 px-2 transition-opacity hover:opacity-80 active:opacity-70"
    >
      <span className="relative flex aspect-square items-center justify-center rounded-2xl bg-muted p-4">
        <Icon size={26} className="text-muted-foreground" strokeWidth={2} />
        {(badgeCount ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-card bg-primary px-1">
            <span className="text-[10px] font-semibold text-white">
              {formatBadgeCount(badgeCount ?? 0)}
            </span>
          </span>
        )}
      </span>
      <span className="text-center text-xs text-card-foreground">{label}</span>
    </button>
  );
}
