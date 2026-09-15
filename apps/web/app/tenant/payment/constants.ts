import type { PaymentMethod, PaymentRecord, TenancyMock } from "./types";

// Mock tenancy — mirrors mobile tenancy structure (my-rental + payment/index.tsx)
export const MOCK_TENANCY: TenancyMock = {
  id: "tenancy_mock_001",
  apartment: {
    id: "apt_mock_001",
    name: "Sunrise Studio — Unit 3B",
    street_address: "123 Rizal Ave",
    barangay: "Barangay 12",
    city: "Caloocan City",
    province: "Metro Manila",
    monthly_rent: 12500,
  },
  landlord: {
    id: "landlord_mock_001",
    first_name: "Maria",
    last_name: "Cruz",
    email: "maria.cruz@example.com",
    avatar_url: null,
  },
  lease_start: "2025-06-15",
  lease_end: "2026-06-14",
  monthly_rent: 12500,
  currentPeriod: {
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    due_date: "2026-04-05",
  },
};

// Static mock history — spread across 2024-2026 for grouping
export const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: "pay_001",
    date: "2026-03-01",
    created_at: "2026-03-01T09:15:00.000Z",
    due_date: "2026-03-05",
    period_start: "2026-03-01",
    period_end: "2026-03-31",
    amount: 12500,
    status: "Paid",
    method: "GCash",
    apartment_name: "Sunrise Studio — Unit 3B",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20260301-001A",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_002",
    date: "2026-02-01",
    created_at: "2026-02-02T14:20:00.000Z",
    due_date: "2026-02-05",
    period_start: "2026-02-01",
    period_end: "2026-02-28",
    amount: 12500,
    status: "Paid",
    method: "Maya",
    apartment_name: "Sunrise Studio — Unit 3B",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20260201-002B",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_003",
    date: "2026-01-03",
    created_at: "2026-01-03T10:00:00.000Z",
    due_date: "2026-01-05",
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    amount: 12500,
    status: "Failed",
    method: "Debit/Credit-Card",
    apartment_name: "Sunrise Studio — Unit 3B",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20260101-003C",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_004",
    date: "2025-12-01",
    created_at: "2025-12-01T08:30:00.000Z",
    due_date: "2025-12-05",
    period_start: "2025-12-01",
    period_end: "2025-12-31",
    amount: 12500,
    status: "Paid",
    method: "QRPh",
    apartment_name: "Sunrise Studio — Unit 3B",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20251201-004D",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_005",
    date: "2025-11-05",
    created_at: "2025-11-05T16:45:00.000Z",
    due_date: "2025-11-05",
    period_start: "2025-11-01",
    period_end: "2025-11-30",
    amount: 12500,
    status: "Pending",
    method: "Cash",
    apartment_name: "Sunrise Studio — Unit 3B",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20251101-005E",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_006",
    date: "2025-10-01",
    created_at: "2025-10-01T11:10:00.000Z",
    due_date: "2025-10-05",
    period_start: "2025-10-01",
    period_end: "2025-10-31",
    amount: 12500,
    status: "Paid",
    method: "GCash",
    apartment_name: "Sunrise Studio — Unit 3B",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20251001-006F",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_007",
    date: "2025-09-01",
    created_at: "2025-09-02T09:00:00.000Z",
    due_date: "2025-09-05",
    period_start: "2025-09-01",
    period_end: "2025-09-30",
    amount: 12500,
    status: "Paid",
    method: "Debit/Credit-Card",
    apartment_name: "Sunrise Studio — Unit 3B",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20250901-007G",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_008",
    date: "2024-12-01",
    created_at: "2024-12-01T10:00:00.000Z",
    due_date: "2024-12-05",
    period_start: "2024-12-01",
    period_end: "2024-12-31",
    amount: 11800,
    status: "Paid",
    method: "Maya",
    apartment_name: "Sunrise Loft — Unit 2A",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20241201-008H",
    tenancy_id: "tenancy_mock_001",
  },
  {
    id: "pay_009",
    date: "2024-11-10",
    created_at: "2024-11-10T15:30:00.000Z",
    due_date: "2024-11-05",
    period_start: "2024-11-01",
    period_end: "2024-11-30",
    amount: 11800,
    status: "Unpaid",
    method: "QRPh",
    apartment_name: "Sunrise Loft — Unit 2A",
    landlord_name: "Maria Cruz",
    reference_id: "APT-20241101-009I",
    tenancy_id: "tenancy_mock_001",
  },
];

export const PAYMENT_METHODS = [
  { key: "GCash", label: "GCash", tileSrc: "/payment-logos/gcash-big-logo.png", chipSrc: "/payment-logos/gcash-logo.png" },
  { key: "Maya", label: "Maya", tileSrc: "/payment-logos/maya-big-logo.jpg", chipSrc: "/payment-logos/maya-logo.png" },
  { key: "QRPh", label: "QRPh", tileSrc: "/payment-logos/qrph-logo.png", chipSrc: "/payment-logos/qrph-logo.png" },
  { key: "Debit/Credit-Card", label: "Debit/Credit Card", tileSrcs: ["/payment-logos/visa-logo.png", "/payment-logos/mastercard-logo.png"], chipSrc: "/payment-logos/visa-logo.png" },
  { key: "Cash", label: "Cash", icon: "cash" as const },
] as const;

export const SAVED_PAYMENT_METHODS = [
  { id: "saved-gcash", method: "GCash" as const, label: "GCash", src: "/payment-logos/gcash-logo.png" },
  { id: "saved-maya", method: "Maya" as const, label: "Maya", src: "/payment-logos/maya-logo.png" },
  { id: "saved-visa", method: "Debit/Credit-Card" as const, label: "Visa •• 4242", src: "/payment-logos/visa-logo.png" },
  { id: "saved-mc", method: "Debit/Credit-Card" as const, label: "Mastercard •• 1234", src: "/payment-logos/mastercard-logo.png" },
];

// ---------------------------------------------------------------------------
// UI-only checkout simulation (mobile parity, no backend).
// Mirrors the mobile paymongo edge-function mock contract:
//   sessionId containing "-fail" → failed, "-expired" → expired, else paid.
// TODO(backend): delete these and call the real paymongo edge function.
// ---------------------------------------------------------------------------

export type MockSessionStatus = "paid" | "failed" | "expired" | "pending";

export function mockSessionIdForReference(referenceId: string): string {
  return `cs_mock_${referenceId}`;
}

export function mockReferenceFromSession(sessionId: string): string {
  return sessionId
    .replace(/^cs_mock_/, "")
    .replace(/^cs_sim_/, "")
    .replace(/^cs_/, "");
}

export function mockSessionStatus(sessionId: string | null | undefined): MockSessionStatus {
  if (!sessionId) return "pending";
  if (sessionId.includes("-expired")) return "expired";
  if (sessionId.includes("-fail")) return "failed";
  return "paid";
}

/** Synthesize the just-paid record for a fresh `pay_xxx` reference (no DB row in UI-only mode). */
export function mockPaymentForSuccess(
  referenceId: string,
  method: PaymentMethod | string | null | undefined,
): PaymentRecord {
  const cash = String(method ?? "").toLowerCase() === "cash";
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return {
    id: `mock_${referenceId}`,
    date: today,
    created_at: now.toISOString(),
    due_date: MOCK_TENANCY.currentPeriod.due_date,
    period_start: MOCK_TENANCY.currentPeriod.period_start,
    period_end: MOCK_TENANCY.currentPeriod.period_end,
    amount: MOCK_TENANCY.monthly_rent,
    status: cash ? "Pending" : "Paid",
    method: (method as PaymentMethod) ?? "GCash",
    apartment_name: MOCK_TENANCY.apartment.name,
    landlord_name: `${MOCK_TENANCY.landlord.first_name} ${MOCK_TENANCY.landlord.last_name}`.trim(),
    reference_id: referenceId,
    tenancy_id: MOCK_TENANCY.id,
  };
}

/** Resolve a success-page receipt: real mock row first, then a synthesized fresh payment. */
export function mockPaymentByReference(
  referenceId: string | null | undefined,
  method?: PaymentMethod | string | null,
): PaymentRecord | null {
  if (!referenceId) return null;
  const found = MOCK_PAYMENTS.find((p) => p.reference_id === referenceId) ?? null;
  if (found) return found;
  if (referenceId.startsWith("pay_")) return mockPaymentForSuccess(referenceId, method ?? "GCash");
  return null;
}


