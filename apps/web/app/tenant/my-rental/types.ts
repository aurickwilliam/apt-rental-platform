export type PaymentStatus = "paid" | "pending" | "late" | "rejected" | "failed";

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: PaymentStatus;
}
