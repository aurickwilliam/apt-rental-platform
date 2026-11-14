export type PaymentStatus = "paid" | "pending" | "late" | "rejected";

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: PaymentStatus;
}
