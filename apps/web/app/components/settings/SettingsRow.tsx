"use client";

import { IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@heroui/react";

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  suffix?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  hideChevron?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  controlsId?: string;
  /** General settings can wrap copy and stack a wide control on phones. */
  responsiveLayout?: "wrap" | "stack-control";
}

export default function SettingsRow({
  icon,
  title,
  description,
  suffix,
  onClick,
  href,
  target,
  rel,
  hideChevron,
  disabled,
  expanded,
  controlsId,
  responsiveLayout,
}: SettingsRowProps) {
  const hasNavigation = Boolean(href || onClick);
  const isInteractive = hasNavigation && !disabled;
  const showChevron = isInteractive && !hideChevron;
  const responsiveClass = responsiveLayout
    ? `settings-row-responsive ${responsiveLayout === "stack-control" ? "settings-row-stack-control" : ""}`
    : "";
  const textLayout = responsiveLayout ? "whitespace-normal break-words" : "truncate";

  const iconEl = (
    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </span>
  );

  const labelEl = (
    <div className="min-w-0">
      <p className={`font-nunito font-semibold text-base ${textLayout} ${disabled ? "text-gray-400" : "text-foreground"}`}>
        {title}
      </p>
      {description && (
        <p className={`font-inter text-sm text-muted-foreground mt-0.5 ${textLayout}`}>{description}</p>
      )}
    </div>
  );

  const trailingEl = (
    <div className="flex items-center gap-2 justify-self-end min-w-0">
      {suffix}
      {showChevron && (
        <IconChevronRight size={16} className="text-muted-foreground flex-shrink-0" aria-hidden="true" />
      )}
    </div>
  );

  if (href) {
    if (disabled) {
      return (
        <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 px-4 ${responsiveClass}`} aria-disabled={true}>
          {iconEl}
          {labelEl}
          {trailingEl}
        </div>
      );
    }
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 px-4 rounded-xl hover:bg-muted/40 transition-colors ${responsiveClass}`}
      >
        {iconEl}
        {labelEl}
        {trailingEl}
      </Link>
    );
  }

  if (onClick) {
    return (
      <Button
        variant="ghost"
        onClick={onClick}
        isDisabled={disabled}
        className={`button--bare grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 px-4 w-full text-left rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${responsiveClass} ${disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-muted/40"}`}
        aria-disabled={disabled}
        aria-expanded={expanded}
        aria-controls={controlsId}
      >
        {iconEl}
        {labelEl}
        {trailingEl}
      </Button>
    );
  }

  return (
    <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 py-3.5 px-4 ${responsiveClass}`} aria-disabled={disabled}>
      {iconEl}
      {labelEl}
      {trailingEl}
    </div>
  );
}
