"use client";

import Image from "next/image";
import { CheckCircle2, Banknote } from "lucide-react";
import { ReactNode } from "react";

type Variant = "tile" | "chip";

interface PaymentMethodButtonProps {
  imageSrc?: string;
  icon?: ReactNode;
  label?: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: Variant;
}

export default function PaymentMethodButton({
  imageSrc,
  icon,
  label,
  selected = false,
  onPress,
  variant = "tile",
}: PaymentMethodButtonProps) {
  const isTile = variant === "tile";

  const baseTile =
    "relative flex flex-col items-center justify-center rounded-2xl border bg-white dark:bg-zinc-900 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";
  const baseChip =
    "relative inline-flex items-center gap-2 rounded-full border bg-white dark:bg-zinc-900 px-3 py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20";

  const selectedClass = selected
    ? "border-primary border-2 bg-primary/5 dark:bg-primary/10 shadow-sm"
    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700";

  if (isTile) {
    return (
      <button
        type="button"
        onClick={onPress}
        aria-pressed={selected}
        className={`${baseTile} ${selectedClass} w-[48.5%] sm:w-[31%] lg:w-[18%] min-h-[86px] p-3`}
      >
        {selected && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-white dark:bg-zinc-900">
            <CheckCircle2 size={18} className="text-primary" fill="currentColor" />
          </span>
        )}

        <span className={`${label ? "h-7 w-12" : "h-10 w-16"} flex items-center justify-center`}>
          {icon ? (
            icon
          ) : imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageSrc} alt={label ?? "payment method"} className="h-full w-full object-contain" />
          ) : null}
        </span>

        {label ? (
          <span className="mt-2 line-clamp-1 text-center text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {label}
          </span>
        ) : null}
      </button>
    );
  }

  // chip
  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={selected}
      className={`${baseChip} ${selectedClass} text-sm`}
    >
      <span className={`${label ? "h-6 w-10" : "h-8 w-12"} flex items-center justify-center shrink-0`}>
        {icon ? (
          icon
        ) : imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageSrc} alt={label ?? "payment"} className="h-full w-full object-contain" />
        ) : null}
      </span>
      {label ? <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span> : null}
      {selected && <CheckCircle2 size={16} className="ml-1 text-primary" />}
    </button>
  );
}


