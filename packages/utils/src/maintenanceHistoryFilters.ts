export type HistoryDateFilter = "any" | "week" | "month" | "year";
export interface MaintenanceHistoryFilters {
  statuses: string[];
  urgencies: string[];
  categories: string[];
  reportedDate: HistoryDateFilter;
}

export const HISTORY_DATE_OPTIONS: { value: HistoryDateFilter; label: string }[] = [
  { value: "any", label: "Any time" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "year", label: "This year" },
];

export function emptyHistoryFilters(): MaintenanceHistoryFilters {
  return { statuses: [], urgencies: [], categories: [], reportedDate: "any" };
}

export function historyFilterCount(filters: MaintenanceHistoryFilters) {
  return Number(filters.statuses.length > 0) + Number(filters.urgencies.length > 0)
    + Number(filters.categories.length > 0) + Number(filters.reportedDate !== "any");
}

const MANILA_DATE_FORMAT = new Intl.DateTimeFormat("en", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" });
const DAY_MS = 24 * 60 * 60 * 1000;

function manilaDay(value: number) {
  const parts = MANILA_DATE_FORMAT.formatToParts(value);
  const number = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(number("year"), number("month") - 1, number("day"));
}

// Presentation-only filters over the account-scoped, bounded history read.
export function filterMaintenanceHistory<T extends { status: string; urgency: string; category: string; created_at: string }>(
  requests: readonly T[], filters: MaintenanceHistoryFilters, now = Date.now(),
): T[] {
  const today = manilaDay(now);
  const firstDay = filters.reportedDate === "week" ? today - 6 * DAY_MS
    : filters.reportedDate === "month" ? today - 29 * DAY_MS
    : Date.UTC(new Date(today).getUTCFullYear(), 0, 1);
  return requests.filter((request) => {
    if (request.status !== "Resolved" && request.status !== "Cancelled") return false;
    if (filters.statuses.length && !filters.statuses.includes(request.status)) return false;
    if (filters.urgencies.length && !filters.urgencies.includes(request.urgency)) return false;
    if (filters.categories.length && !filters.categories.includes(request.category)) return false;
    if (filters.reportedDate === "any") return true;
    const time = Date.parse(request.created_at);
    if (!Number.isFinite(time)) return false;
    const day = manilaDay(time);
    return day >= firstDay && day <= today;
  });
}
