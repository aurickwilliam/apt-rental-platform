// Compatibility entry point: web and mobile use the same presentation rules.
export {
  emptyHistoryFilters,
  filterMaintenanceHistory,
  historyFilterCount,
  HISTORY_DATE_OPTIONS,
} from "@repo/utils/maintenance-history";
export type { HistoryDateFilter, MaintenanceHistoryFilters } from "@repo/utils/maintenance-history";
