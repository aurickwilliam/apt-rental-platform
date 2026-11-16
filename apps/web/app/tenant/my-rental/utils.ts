import type { PaymentStatus } from "./types";

const MANILA = "Asia/Manila";

export function normalizePaymentStatus(status?: string | null): PaymentStatus {
  const value = status?.toLowerCase() ?? "";
  if (value === "paid" || value === "completed" || value === "succeeded") return "paid";
  if (value === "late" || value === "overdue") return "late";
  if (value === "rejected" || value === "declined") return "rejected";
  // An attempt that ended without money moving is never shown as still pending.
  if (value === "failed" || value === "expired" || value === "cancelled" || value === "canceled") return "failed";
  return "pending";
}

export function formatMonthYear(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: MANILA,
  }).format(new Date(dateStr));
}

export function formatShortDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: MANILA,
  }).format(new Date(dateStr));
}

export function formatAddress(apartment: {
  street_address: string;
  barangay: string;
  city: string;
  province: string;
}) {
  return [apartment.street_address, apartment.barangay, apartment.city, apartment.province]
    .filter(Boolean)
    .join(", ");
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

export function formatLandlordName(
  landlord: { first_name: string | null; last_name: string | null } | null,
) {
  if (!landlord) return "Landlord";
  return `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() || "Landlord";
}
