import { useStatusChipStyles, type StatusChipStyle } from "@/hooks/useStatusChipStyles";
import { PAYMENT_STATUS } from "@repo/constants";

export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export function usePaymentStatusStyles(): Record<PaymentStatus, StatusChipStyle> {
  const status = useStatusChipStyles();
  return {
    Paid: status.success,
    Pending: status.warning,
    Unpaid: status.danger,
  };
}
