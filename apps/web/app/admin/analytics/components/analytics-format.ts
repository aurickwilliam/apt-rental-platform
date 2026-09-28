import type { AnalyticsTrend } from "../types";

export const numberFormat = new Intl.NumberFormat("en-PH");
export const percentFormat = new Intl.NumberFormat("en-PH", {
  style: "percent",
  maximumFractionDigits: 1,
});
export const moneyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});
export const compactMoneyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const fullDateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function shortDate(date: string): string {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

export function bucketDateLabel(
  row: Pick<AnalyticsTrend, "bucket_start" | "bucket_end"> | undefined,
): string {
  if (!row) return "";
  const start = fullDateFormat.format(
    new Date(`${row.bucket_start}T00:00:00Z`),
  );
  if (row.bucket_start === row.bucket_end) return start;
  const end = fullDateFormat.format(new Date(`${row.bucket_end}T00:00:00Z`));
  return `${start} – ${end}`;
}

export function periodLabel(from: string, to: string): string {
  return `${fullDateFormat.format(new Date(`${from}T00:00:00Z`))} – ${fullDateFormat.format(new Date(`${to}T00:00:00Z`))}`;
}
