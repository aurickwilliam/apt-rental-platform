import { formatPesoDisplay } from "@repo/utils";
import type { PaymentMethod, PaymentStatus } from "./types";

export { formatPesoDisplay };

export function formatDateShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export function formatDateFull(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "full" }).format(d);
}

export function formatTimeShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(d);
}

export function periodMonthLabel(dueOrPeriod: string | null | undefined): string {
  if (!dueOrPeriod) return "—";
  const d = new Date(`${dueOrPeriod.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dueOrPeriod.slice(0, 7);
  return new Intl.DateTimeFormat("en-US", { month: "long" }).format(d);
}

export function methodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  if (method === "Debit/Credit-Card") return "Debit/Credit Card";
  if (method === "gcash") return "GCash";
  if (method === "maya") return "Maya";
  if (method === "qrph") return "QRPh";
  if (method === "card") return "Debit/Credit Card";
  if (method === "cash") return "Cash";
  return method;
}

export function paymentStatusLabel(status: string | null | undefined): PaymentStatus {
  const v = (status ?? "").toLowerCase();
  if (v === "paid" || v === "completed" || v === "succeeded") return "Paid";
  if (v === "pending") return "Pending";
  if (v === "failed" || v === "rejected" || v === "unpaid") return v === "unpaid" ? "Unpaid" : "Failed";
  return "Pending";
}

export function formatReferenceId(ref: string | null | undefined): string {
  if (!ref) return "—";
  // APT-20260301-001A already formatted; keep as-is. For pay_ ids, prettify
  if (ref.startsWith("pay_")) return ref.replace("pay_", "PAY-").toUpperCase();
  return ref;
}

export function formatLeaseDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "numeric", year: "numeric" }).format(d);
}

export function paymentMethodToDisplay(method: PaymentMethod | string): string {
  return methodLabel(method);
}

export function statusVariant(status: PaymentStatus): "success" | "warning" | "danger" | "default" {
  if (status === "Paid") return "success";
  if (status === "Pending") return "warning";
  if (status === "Failed" || status === "Unpaid") return "danger";
  return "default";
}

export function statusTone(status: PaymentStatus): { bg: string; text: string; dot: string } {
  if (status === "Paid") return { bg: "bg-green-100 dark:bg-green-900/40", text: "text-green-700 dark:text-green-300", dot: "bg-green-500" };
  if (status === "Pending") return { bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-700 dark:text-amber-300", dot: "bg-amber-500" };
  return { bg: "bg-red-100 dark:bg-red-900/40", text: "text-red-600 dark:text-red-300", dot: "bg-red-500" };
}


