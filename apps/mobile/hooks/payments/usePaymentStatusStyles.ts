import { useColors } from "@/hooks/useTheme";
import { PAYMENT_STATUS } from "@repo/constants";

export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

type StatusStyle = { backgroundColor: string; textColor: string };

export function usePaymentStatusStyles(): Record<PaymentStatus, StatusStyle> {
  const { colors } = useColors();
  return {
    Paid: {
      backgroundColor: colors.successLight,
      textColor: colors.success,
    },
    Partial: {
      backgroundColor: colors.warningLight,
      textColor: colors.warning,
    },
    Pending: {
      backgroundColor: colors.gray100,
      textColor: colors.gray500,
    },
    Unpaid: {
      backgroundColor: colors.dangerLight,
      textColor: colors.danger,
    },
  };
}
