import { formatDate } from "./formatDate";

export function getRelativeTime(timestamp: Date | number | string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const absSeconds = Math.abs(seconds);
  const isFuture = seconds < 0;

  // Just now
  if (absSeconds < 10) return "just now";

  // Yesterday / Tomorrow
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  if (isSameDay(date, yesterday)) return "yesterday";
  if (isSameDay(date, tomorrow)) return "tomorrow";

   const intervals: [number, number, string][] = [
    [3600,        60,          "minute"],
    [86400,       3600,        "hour"],
    [86400 * 7,   86400,       "day"],
    [86400 * 30,  86400 * 7,   "week"],
    [86400 * 365, 86400 * 30,  "month"],
  ];

  for (const [threshold, divisor, unit] of intervals) {
    if (absSeconds < threshold) {
      const value = Math.floor(absSeconds / divisor);
      const label = `${value} ${unit}${value !== 1 ? "s" : ""}`;
      return isFuture ? `in ${label}` : `${label} ago`;
    }
  }

  return formatDate(date); // Fallback to absolute date for times beyond a year
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}