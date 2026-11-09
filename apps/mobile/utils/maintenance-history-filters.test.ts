import { emptyHistoryFilters, filterMaintenanceHistory, historyFilterCount } from "./maintenance-history-filters";

const rows = [
  { status: "Resolved" as const, urgency: "low" as const, category: "appliances", created_at: "2026-11-04T00:00:00Z" },
  { status: "Cancelled" as const, urgency: "high" as const, category: "electrical_lighting", created_at: "2026-11-01T00:00:00Z" },
  { status: "Pending" as const, urgency: "low" as const, category: "appliances", created_at: "2026-11-04T00:00:00Z" },
];
const now = Date.parse("2026-11-04T08:00:00Z");

it("starts unfiltered but never admits active requests", () => {
  expect(filterMaintenanceHistory(rows, emptyHistoryFilters(), now)).toEqual(rows.slice(0, 2));
  expect(historyFilterCount(emptyHistoryFilters())).toBe(0);
});

it("combines dimensions with AND and selections within each dimension with OR", () => {
  const filters = { ...emptyHistoryFilters(), statuses: ["Cancelled", "Resolved"], urgencies: ["high"], categories: ["electrical_lighting"] };
  expect(filterMaintenanceHistory(rows, filters, now)).toEqual([rows[1]]);
  expect(historyFilterCount(filters)).toBe(3);
  expect(rows).toHaveLength(3);
});

it("uses Manila calendar days including today for the seven-day range", () => {
  const times = ["2026-10-28T15:59:59Z", "2026-10-28T16:00:00Z", "2026-11-04T15:59:59Z", "2026-11-04T16:00:00Z"];
  const requests = times.map((created_at) => ({ ...rows[0], created_at }));
  expect(filterMaintenanceHistory(requests, { ...emptyHistoryFilters(), reportedDate: "week" }, now)).toEqual(requests.slice(1, 3));
});

it("supports the thirty-day range and current Manila year without future or invalid dates", () => {
  const times = ["2025-12-31T15:59:59Z", "2025-12-31T16:00:00Z", "2026-10-05T16:00:00Z", "2026-10-05T15:59:59Z", "bad-date", "2026-12-01T00:00:00Z"];
  const requests = times.map((created_at) => ({ ...rows[0], created_at }));
  expect(filterMaintenanceHistory(requests, { ...emptyHistoryFilters(), reportedDate: "month" }, now)).toEqual([requests[2]]);
  expect(filterMaintenanceHistory(requests, { ...emptyHistoryFilters(), reportedDate: "year" }, now)).toEqual([requests[1], requests[2], requests[3]]);
});
