export type PaymentStatus = "paid" | "pending" | "late";
export type MaintenanceStatus = "pending" | "in_progress" | "resolved";

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: PaymentStatus;
}

export interface PaymentBreakdownItem {
  key: string;
  label: string;
  amount: number;
}

export interface MaintenanceItem {
  id: string;
  title: string;
  subtitle: string;
  status: MaintenanceStatus;
}
