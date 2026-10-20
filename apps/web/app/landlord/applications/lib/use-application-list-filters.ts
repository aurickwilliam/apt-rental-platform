"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { APPLICATION_DATE_OPTIONS, APPLICATION_SORT_OPTIONS, APPLICATION_STATUS_OPTIONS, type ApplicationListSort } from "./application-list";

export default function useApplicationListFilters() {
  const params = useSearchParams();
  const status = params.get("status") ?? "All";
  const days = params.get("days") ?? "All";
  const sortValue = params.get("sort") ?? "created_at:descending";
  const selectedSort = APPLICATION_SORT_OPTIONS.some((option) => option.value === sortValue) ? sortValue : "created_at:descending";
  const sort = useMemo<ApplicationListSort>(() => {
    const [column, direction] = selectedSort.split(":");
    return { column, direction: direction === "ascending" ? "ascending" : "descending" };
  }, [selectedSort]);

  function update(patch: Record<string, string>) {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries(patch)) {
      if (!value || value === "All" || (key === "sort" && value === "created_at:descending")) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    // Next integrates native history with useSearchParams. Filtering this
    // already-loaded client list needs no server navigation or extra fetch.
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return {
    search: params.get("q") ?? "",
    statusFilter: APPLICATION_STATUS_OPTIONS.some((option) => option.value === status) ? status : "All",
    cityFilter: params.get("city") ?? "All",
    propertyFilter: params.get("property") ?? "All",
    dateFilter: APPLICATION_DATE_OPTIONS.some((option) => option.value === days) ? days : "All",
    sort,
    setSearch: (value: string) => update({ q: value }),
    setStatusFilter: (value: string) => update({ status: value }),
    setCityFilter: (value: string) => update({ city: value }),
    setPropertyFilter: (value: string) => update({ property: value }),
    setDateFilter: (value: string) => update({ days: value }),
    setSort: (value: ApplicationListSort) => update({ sort: `${value.column}:${value.direction}` }),
    clearFilters: () => update({ q: "", status: "All", city: "All", property: "All", days: "All" }),
  };
}
