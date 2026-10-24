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
import { PAYMENT_METHOD_COLORS, paymentMethodKey, type PaymentMethodKey } from "@repo/constants";
import { methodLabel } from "@/app/tenant/payment/utils";

const METHOD_ICONS: Record<PaymentMethodKey, ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  gcash: IconDeviceMobile,
  maya: IconWallet,
  qrph: IconQrcode,
  card: IconCreditCard,
  cash: IconCash,
};

interface PaymentMethodChipProps {
  method: string | null | undefined;
  className?: string;
}

export default function PaymentMethodChip({ method, className }: PaymentMethodChipProps) {
  const key = paymentMethodKey(method);
  const colors = key ? PAYMENT_METHOD_COLORS[key] : null;
  const Icon = key ? METHOD_ICONS[key] : null;
  const vars = colors
    ? ({
        "--method-bg": colors.light.backgroundColor,
        "--method-fg": colors.light.textColor,
        "--method-border": colors.light.borderColor,
        "--method-bg-dark": colors.dark.backgroundColor,
        "--method-fg-dark": colors.dark.textColor,
        "--method-border-dark": colors.dark.borderColor,
      } as CSSProperties)
    : undefined;

  return (
    <Chip
      size="sm"
      variant="soft"
      color="default"
      style={vars}
      className={`${colors ? "method-chip" : ""} text-[11px] ${className ?? ""}`}
    >
      {Icon ? <Icon size={12} aria-hidden /> : null}
      {methodLabel(method)}
    </Chip>
  );
}
