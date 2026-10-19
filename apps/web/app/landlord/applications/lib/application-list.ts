import type { LandlordApplication } from "@/service/landlordApplicationsService";

export interface ApplicationListFilters {
  search: string;
  status: string;
  city: string;
  property: string;
  days: string;
}

export interface ApplicationListSort {
  column: string;
  direction: "ascending" | "descending";
}

export const APPLICATION_STATUS_OPTIONS = [
  { value: "All", label: "All Status" },
  { value: "Applied", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Rejected" },
  { value: "Cancelled", label: "Cancelled" },
] as const;

export const APPLICATION_DATE_OPTIONS = [
  { value: "All", label: "All Dates" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
] as const;

export const APPLICATION_SORT_OPTIONS = [
  { value: "created_at:descending", label: "Newest First" },
  { value: "created_at:ascending", label: "Oldest First" },
  { value: "tenant_name:ascending", label: "Tenant A–Z" },
  { value: "tenant_name:descending", label: "Tenant Z–A" },
  { value: "apartment_name:ascending", label: "Property A–Z" },
  { value: "apartment_name:descending", label: "Property Z–A" },
  { value: "apartment_city:ascending", label: "Location A–Z" },
  { value: "apartment_city:descending", label: "Location Z–A" },
  { value: "status:ascending", label: "Status A–Z" },
  { value: "status:descending", label: "Status Z–A" },
] as const;

export function applicationStatusLabel(status: string): string {
  return status === "Applied" ? "Pending" : status;
}

export function applicationSummary(applications: LandlordApplication[]) {
  return {
    total: applications.length,
    approved: applications.filter((application) => application.status === "Approved").length,
    rejected: applications.filter((application) => application.status === "Rejected").length,
    pending: applications.filter((application) => application.status === "Applied").length,
  };
}

export function filterApplicationList(applications: LandlordApplication[], filters: ApplicationListFilters, now = Date.now()) {
  const query = filters.search.trim().toLowerCase();
  const cutoff = filters.days === "All" ? null : now - Number(filters.days) * 24 * 60 * 60 * 1000;
  return applications.filter((application) => {
    if (filters.status !== "All" && application.status !== filters.status) return false;
    if (filters.city !== "All" && application.apartment_city !== filters.city) return false;
    if (filters.property !== "All" && application.apartment_id !== filters.property) return false;
    if (cutoff !== null && !(Date.parse(application.created_at) >= cutoff)) return false;
    return !query || [application.tenant_name, application.tenant_email, application.apartment_name, application.apartment_city, application.apartment_address]
      .some((value) => value?.toLowerCase().includes(query));
  });
}

export function sortApplicationList(applications: LandlordApplication[], sort: ApplicationListSort) {
  const direction = sort.direction === "ascending" ? 1 : -1;
  return [...applications].sort((a, b) => {
    let comparison: number;
    switch (sort.column) {
      case "tenant_name": comparison = a.tenant_name.localeCompare(b.tenant_name); break;
      case "apartment_name": comparison = a.apartment_name.localeCompare(b.apartment_name); break;
      case "apartment_city": comparison = a.apartment_city.localeCompare(b.apartment_city); break;
      case "status": comparison = applicationStatusLabel(a.status).localeCompare(applicationStatusLabel(b.status)); break;
      default: comparison = Date.parse(a.created_at) - Date.parse(b.created_at);
    }
    return comparison * direction || a.id.localeCompare(b.id);
  });
}
