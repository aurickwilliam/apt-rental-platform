import type { ComponentType } from "react";
import { Chip } from "heroui-native";
import {
  IconCash,
  IconCreditCard,
  IconDeviceMobile,
  IconQrcode,
  IconWallet,
} from "@tabler/icons-react-native";

import { PAYMENT_METHOD_COLORS, paymentMethodKey, type PaymentMethodKey } from "@repo/constants";

import { useColors } from "@/hooks/useTheme";
import { methodLabel } from "@/service/payments/paymentService";

type MethodIcon = ComponentType<{ size?: number; color?: string }>;

// Each method also has its own icon, so the chip never depends on color alone.
const METHOD_ICONS: Record<PaymentMethodKey, MethodIcon> = {
  gcash: IconDeviceMobile,
  maya: IconWallet,
  qrph: IconQrcode,
  card: IconCreditCard,
  cash: IconCash,
};

interface PaymentMethodChipProps {
  method: string | null | undefined;
}

// The same chip as the web's PaymentMethodChip: one hue and icon per method, a plain
// gray chip for a method it does not know.
export default function PaymentMethodChip({ method }: PaymentMethodChipProps) {
  const { colors, isDark } = useColors();
  const key = paymentMethodKey(method);
  const palette = key ? PAYMENT_METHOD_COLORS[key][isDark ? "dark" : "light"] : null;
  const Icon = key ? METHOD_ICONS[key] : null;
  const textColor = palette?.textColor ?? colors.gray500;

  return (
    <Chip
      variant="soft"
      size="sm"
      animation="disable-all"
      style={
        palette
          ? { backgroundColor: palette.backgroundColor, borderColor: palette.borderColor, borderWidth: 1 }
          : { backgroundColor: colors.gray100 }
      }
    >
      {Icon ? <Icon size={12} color={textColor} /> : null}
      <Chip.Label style={{ color: textColor }} className="text-[11px] font-nunitoSemiBold">
        {methodLabel(method ?? null)}
      </Chip.Label>
    </Chip>
  );
}
