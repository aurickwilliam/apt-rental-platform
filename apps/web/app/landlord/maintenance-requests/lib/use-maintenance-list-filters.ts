"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { MAINTENANCE_DATE_OPTIONS, MAINTENANCE_SORT_OPTIONS, MAINTENANCE_STATUS_OPTIONS, MAINTENANCE_URGENCY_OPTIONS, type MaintenanceListSort } from "./maintenance-list";

export default function useMaintenanceListFilters() {
  const params = useSearchParams();
  const status = params.get("status") ?? "All";
  const urgency = params.get("urgency") ?? "All";
  const days = params.get("days") ?? "All";
  const sortValue = params.get("sort") ?? "reported_at:descending";
  const selectedSort = MAINTENANCE_SORT_OPTIONS.some((option) => option.value === sortValue) ? sortValue : "reported_at:descending";
  const sort = useMemo<MaintenanceListSort>(() => {
    const [column, direction] = selectedSort.split(":");
    return { column, direction: direction === "ascending" ? "ascending" : "descending" };
  }, [selectedSort]);

  function update(patch: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "All" || (key === "sort" && value === "reported_at:descending")) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }
  return {
    search: params.get("q") ?? "",
    statusFilter: MAINTENANCE_STATUS_OPTIONS.some((option) => option.value === status) ? status : "All",
    urgencyFilter: MAINTENANCE_URGENCY_OPTIONS.some((option) => option.value === urgency) ? urgency : "All",
    cityFilter: params.get("city") ?? "All",
    propertyFilter: params.get("property") ?? "All",
    dateFilter: MAINTENANCE_DATE_OPTIONS.some((option) => option.value === days) ? days : "All",
    sort,
    setSearch: (value: string) => update({ q: value }),
    setStatusFilter: (value: string) => update({ status: value }),
    setUrgencyFilter: (value: string) => update({ urgency: value }),
    setCityFilter: (value: string) => update({ city: value }),
    setPropertyFilter: (value: string) => update({ property: value }),
    setDateFilter: (value: string) => update({ days: value }),
    setSort: (value: MaintenanceListSort) => update({ sort: `${value.column}:${value.direction}` }),
    clearFilters: () => update({ q: "", status: "All", urgency: "All", city: "All", property: "All", days: "All" }),
  };
}
