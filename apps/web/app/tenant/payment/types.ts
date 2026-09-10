export type PaymentMethod = "GCash" | "Maya" | "QRPh" | "Debit/Credit-Card" | "Cash";

export type PaymentStatus = "Paid" | "Pending" | "Failed" | "Unpaid";

export interface PaymentRecord {
  id: string;
  date: string; // ISO date yyyy-mm-dd
  created_at: string; // ISO datetime
  due_date: string | null;
  period_start: string | null;
  period_end: string | null;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod | string;
  apartment_name: string | null;
  landlord_name: string | null;
  reference_id: string;
  tenancy_id: string;
}

export type SelectedPaymentMethod =
  | { kind: "saved"; id: string; method: PaymentMethod }
  | { kind: "new"; method: PaymentMethod }
  | null;

export interface TenancyMock {
  id: string;
  apartment: {
    id: string;
    name: string;
    street_address: string;
    barangay: string;
    city: string;
    province: string;
    monthly_rent: number;
  };
  landlord: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string | null;
  };
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number;
  currentPeriod: {
    period_start: string;
    period_end: string;
    due_date: string;
  };
}

export type CardInformation = {
  cardNumber: string;
  expiryDate: string;
  cardholderName: string;
  cvv: string;
  isPaymentSaved: boolean;
  isCardNumberValid?: boolean;
};

export type CashPaymentErrors = {
  paymentDate?: string;
};

export type PaymentHistoryFilter = {
  years: string[];
  statuses: PaymentStatus[];
  sort: "Newest" | "Oldest";
};

export type PaymentSort = "Newest" | "Oldest";


