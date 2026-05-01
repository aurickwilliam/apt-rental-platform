export type PaymentStatus = "paid" | "pending" | "late";
export type MaintenanceStatus = "pending" | "in_progress" | "resolved";
export type AppStep = "done" | "active" | "pending";

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: PaymentStatus;
}

export interface MaintenanceItem {
  id: string;
  title: string;
  subtitle: string;
  status: MaintenanceStatus;
}

export interface Message {
  id: string;
  sender: string;
  initials: string;
  preview: string;
  time: string;
  unread: boolean;
}

export interface AppStepItem {
  label: string;
  status: AppStep;
}
