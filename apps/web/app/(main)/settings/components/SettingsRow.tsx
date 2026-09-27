"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  suffix?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}

export default function SettingsRow({
  icon,
  title,
  description,
  suffix,
  onClick,
  href,
  disabled,
}: SettingsRowProps) {
  const hasNavigation = Boolean(href || onClick);
  const isInteractive = hasNavigation && !disabled;

  const iconEl = (
    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </span>
  );

  const labelEl = (
    <div className="min-w-0">
      <p className={`font-nunito font-semibold text-base truncate ${disabled ? "text-gray-400" : "text-foreground"}`}>
        {title}
      </p>
      {description && (
        <p className="font-inter text-sm text-muted-foreground mt-0.5 truncate">{description}</p>
      )}
    </div>
  );

  const trailingEl = (
    <div className="flex items-center gap-2 justify-self-end min-w-0">
      {suffix}
      {isInteractive && (
        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 px-4 hover:bg-muted/40 transition-colors"
        aria-disabled={disabled}
      >
        {iconEl}
        {labelEl}
        {trailingEl}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 px-4 w-full text-left hover:bg-muted/40 transition-colors"
        aria-disabled={disabled}
      >
        {iconEl}
        {labelEl}
        {trailingEl}
      </button>
    );
  }

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 px-4" aria-disabled={disabled}>
      {iconEl}
      {labelEl}
      {trailingEl}
    </div>
  );
}