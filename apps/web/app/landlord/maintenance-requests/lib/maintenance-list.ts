import type { LandlordMaintenanceRequest } from "@/service/landlordMaintenanceService";

export interface MaintenanceListFilters {
  search: string;
  status: string;
  urgency: string;
  city: string;
  property: string;
  days: string;
}

export interface MaintenanceListSort {
  column: string;
  direction: "ascending" | "descending";
}

export const MAINTENANCE_STATUS_OPTIONS = [
  { value: "All", label: "All Status" }, { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" }, { value: "Resolved", label: "Resolved" }, { value: "Cancelled", label: "Cancelled" },
] as const;
export const MAINTENANCE_URGENCY_OPTIONS = [
  { value: "All", label: "All Urgency" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" },
] as const;
export const MAINTENANCE_DATE_OPTIONS = [
  { value: "All", label: "All Dates" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" },
] as const;
export const MAINTENANCE_SORT_OPTIONS = [
  { value: "reported_at:descending", label: "Newest First" }, { value: "reported_at:ascending", label: "Oldest First" },
  { value: "urgency:descending", label: "Highest Urgency" }, { value: "urgency:ascending", label: "Lowest Urgency" },
  { value: "status:ascending", label: "Status A–Z" }, { value: "status:descending", label: "Status Z–A" },
] as const;

export function maintenancePropertyKey(request: LandlordMaintenanceRequest): string {
  return request.apartment_id || request.apartment_name;
}

export function maintenanceSummary(requests: LandlordMaintenanceRequest[]) {
  return {
    total: requests.length,
    resolved: requests.filter((request) => request.status === "Resolved").length,
    inProgress: requests.filter((request) => request.status === "In Progress").length,
    cancelled: requests.filter((request) => request.status === "Cancelled").length,
  };
}

export function filterMaintenanceList(requests: LandlordMaintenanceRequest[], filters: MaintenanceListFilters, now = Date.now()) {
  const query = filters.search.trim().toLowerCase();
  const cutoff = filters.days === "All" ? null : now - Number(filters.days) * 24 * 60 * 60 * 1000;
  return requests.filter((request) => {
    if (filters.status !== "All" && request.status !== filters.status) return false;
    if (filters.urgency !== "All" && request.urgency !== filters.urgency) return false;
    if (filters.city !== "All" && request.apartment_city !== filters.city) return false;
    if (filters.property !== "All" && maintenancePropertyKey(request) !== filters.property) return false;
    if (cutoff !== null && !(Date.parse(request.reported_at) >= cutoff)) return false;
    return !query || [request.issue_title, request.description, request.apartment_name, request.apartment_city, request.apartment_address, request.tenant_name, request.tenant_email]
      .some((value) => value?.toLowerCase().includes(query));
  });
}

export function sortMaintenanceList(requests: LandlordMaintenanceRequest[], sort: MaintenanceListSort) {
  const direction = sort.direction === "ascending" ? 1 : -1;
  const urgencyRank = { low: 0, medium: 1, high: 2 };
  return [...requests].sort((a, b) => {
    const comparison = sort.column === "urgency" ? urgencyRank[a.urgency] - urgencyRank[b.urgency]
      : sort.column === "status" ? a.status.localeCompare(b.status) : Date.parse(a.reported_at) - Date.parse(b.reported_at);
    return comparison * direction || Date.parse(b.reported_at) - Date.parse(a.reported_at) || a.id.localeCompare(b.id);
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
export function maintenanceReportedAge(value: string, now = Date.now()): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "Date unavailable";
  const days = Math.floor(Math.abs(now - timestamp) / DAY_MS);
  if (days === 0) return "Today";
  const [amount, unit] = days >= DAYS_PER_YEAR ? [Math.floor(days / DAYS_PER_YEAR), "year"] as const
    : days >= DAYS_PER_MONTH ? [Math.floor(days / DAYS_PER_MONTH), "month"] as const : [days, "day"] as const;
  return new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(timestamp > now ? amount : -amount, unit);
}
