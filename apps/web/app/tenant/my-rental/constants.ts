import type { MaintenanceItem, PaymentBreakdownItem } from "./types";

export const DEFAULT_PAYMENT_BREAKDOWN: PaymentBreakdownItem[] = [
  { key: "base_rent", label: "Monthly rent", amount: 8500 },
  { key: "association_dues", label: "Association dues", amount: 0 },
  { key: "water_bill", label: "Water bill", amount: 0 },
  { key: "electricity", label: "Electricity", amount: 0 },
];

export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  { id: "1", title: "Leaky faucet — Kitchen", subtitle: "Plumber scheduled for Apr 26", status: "in_progress" },
  { id: "2", title: "Ceiling paint peeling", subtitle: "Awaiting review", status: "pending" },
  { id: "3", title: "Broken window latch", subtitle: "Resolved on Apr 18", status: "resolved" },
];
