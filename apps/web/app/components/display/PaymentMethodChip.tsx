"use client";

import type { ComponentType, CSSProperties } from "react";
import { Chip } from "@heroui/react";
import {
  IconCash,
  IconCreditCard,
  IconDeviceMobile,
  IconQrcode,
  IconWallet,
} from "@tabler/icons-react";
import { methodLabel } from "@/app/tenant/payment/utils";

type MethodKey = "gcash" | "maya" | "qrph" | "card" | "cash";

type MethodStyle = {
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  light: { bg: string; fg: string; border: string };
  dark: { bg: string; fg: string; border: string };
};

// One hue per method, kept apart from the status chips' green / amber / red so a
// method is never mistaken for a status. Each also has its own icon, so the chip
// never depends on color alone.
const METHOD_STYLES: Record<MethodKey, MethodStyle> = {
  gcash: {
    icon: IconDeviceMobile,
    light: { bg: "#DBEAFE", fg: "#1D4ED8", border: "#93C5FD" },
    dark: { bg: "#1E3A8A", fg: "#BFDBFE", border: "#3B82F6" },
  },
  maya: {
    icon: IconWallet,
    light: { bg: "#CCFBF1", fg: "#115E59", border: "#5EEAD4" },
    dark: { bg: "#134E4A", fg: "#99F6E4", border: "#14B8A6" },
  },
  qrph: {
    icon: IconQrcode,
    light: { bg: "#EDE9FE", fg: "#5B21B6", border: "#C4B5FD" },
    dark: { bg: "#4C1D95", fg: "#DDD6FE", border: "#8B5CF6" },
  },
  card: {
    icon: IconCreditCard,
    light: { bg: "#FAE8FF", fg: "#86198F", border: "#F0ABFC" },
    dark: { bg: "#701A75", fg: "#F5D0FE", border: "#D946EF" },
  },
  cash: {
    icon: IconCash,
    light: { bg: "#FFEDD5", fg: "#9A3412", border: "#FDBA74" },
    dark: { bg: "#7C2D12", fg: "#FED7AA", border: "#F97316" },
  },
};

function methodKey(method: string | null | undefined): MethodKey | null {
  const value = (method ?? "").trim().toLowerCase();
  if (value === "gcash" || value === "maya" || value === "qrph" || value === "cash") return value;
  if (value === "card" || value === "debit/credit-card") return "card";
  return null;
}

interface PaymentMethodChipProps {
  method: string | null | undefined;
  className?: string;
}

export default function PaymentMethodChip({ method, className }: PaymentMethodChipProps) {
  const key = methodKey(method);
  const style = key ? METHOD_STYLES[key] : null;
  const Icon = style?.icon;
  const vars = style
    ? ({
        "--method-bg": style.light.bg,
        "--method-fg": style.light.fg,
        "--method-border": style.light.border,
        "--method-bg-dark": style.dark.bg,
        "--method-fg-dark": style.dark.fg,
        "--method-border-dark": style.dark.border,
      } as CSSProperties)
    : undefined;

  return (
    <Chip
      size="sm"
      variant="soft"
      color="default"
      style={vars}
      className={`${style ? "method-chip" : ""} text-[11px] ${className ?? ""}`}
    >
      {Icon ? <Icon size={12} aria-hidden /> : null}
      {methodLabel(method)}
    </Chip>
  );
}
