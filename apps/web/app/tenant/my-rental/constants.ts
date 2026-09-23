import type { PaymentBreakdownItem } from "./types";

export const DEFAULT_PAYMENT_BREAKDOWN: PaymentBreakdownItem[] = [
  { key: "base_rent", label: "Monthly rent", amount: 8500 },
  { key: "association_dues", label: "Association dues", amount: 0 },
  { key: "water_bill", label: "Water bill", amount: 0 },
  { key: "electricity", label: "Electricity", amount: 0 },
];
