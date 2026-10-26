"use client";

import { Suspense, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Chip, Dropdown, InputGroup, Label, Table } from "@heroui/react";
import { IconSearch as Search, IconFilter as ListFilter, IconTools as Hammer, IconCalendar as Calendar, IconMapPin, IconDotsVertical, IconCircleCheck, IconClock, IconX } from "@tabler/icons-react";
import { formatDate, formatPesoDisplay, getInitials } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useLandlordMaintenanceRequests } from "@/hooks/use-landlord-maintenance-requests";
import { useLandlordActionBadges } from "@/hooks/use-landlord-action-badges";
import { MAINTENANCE_URGENCY_STYLE, maintenanceStatusChipColor, type LandlordMaintenanceStatus } from "./lib/maintenance-status";
import { MAINTENANCE_DATE_OPTIONS, MAINTENANCE_SORT_OPTIONS, MAINTENANCE_STATUS_OPTIONS, MAINTENANCE_URGENCY_OPTIONS, filterMaintenanceList, maintenancePropertyKey, maintenanceReportedAge, maintenanceSummary, sortMaintenanceList } from "./lib/maintenance-list";
import useMaintenanceListFilters from "./lib/use-maintenance-list-filters";
import MaintenanceEmptyState from "./components/MaintenanceEmptyState";
import MaintenanceHeader from "./components/MaintenanceHeader";
import MaintenanceSummary from "./components/MaintenanceSummary";
import MaintenanceSkeleton, { MaintenanceCountSkeleton, MaintenanceResultsSkeleton } from "./components/MaintenanceSkeletons";
import PresentationBoundary from "@/app/components/display/PresentationBoundary";
import type { PresentationSeed } from "@/service/presentation-seed";
import type { LandlordMaintenanceRequest } from "@/service/landlordMaintenanceService";

function MaintenanceStatusIcon({ status }: { status: LandlordMaintenanceStatus }) {
  const Icon = status === "Resolved" ? IconCircleCheck : status === "Cancelled" ? IconX : IconClock;
  return <Icon size={15} aria-hidden="true" />;
}

export default function MaintenanceRequestsClient({ initial }: { initial: PresentationSeed<LandlordMaintenanceRequest[]> }) {
  return <PresentationBoundary initial={initial}>{(seed) => <Suspense fallback={<MaintenanceSkeleton />}><MaintenanceContent initial={seed} /></Suspense>}</PresentationBoundary>;
}

function MaintenanceContent({ initial }: { initial?: PresentationSeed<LandlordMaintenanceRequest[]> }) {
  const router = useRouter();
  const { requests, loading, error, refresh } = useLandlordMaintenanceRequests(undefined, initial);
  const { markViewed } = useLandlordActionBadges();
  const { search, statusFilter, urgencyFilter, cityFilter, propertyFilter, dateFilter, sort,
    setSearch, setStatusFilter, setUrgencyFilter, setCityFilter, setPropertyFilter, setDateFilter, setSort, clearFilters } = useMaintenanceListFilters();

  const cities = useMemo(() => [...new Set(requests.map((request) => request.apartment_city).filter(Boolean))].sort(), [requests]);
  const properties = useMemo(() => [...new Map(requests.map((request) => [maintenancePropertyKey(request), { value: maintenancePropertyKey(request), label: request.apartment_name }])).values()].sort((a, b) => a.label.localeCompare(b.label)), [requests]);
  const summary = useMemo(() => maintenanceSummary(requests), [requests]);
  const filtered = useMemo(() => sortMaintenanceList(filterMaintenanceList(requests, {
    search, status: statusFilter, urgency: urgencyFilter, city: cityFilter, property: propertyFilter, days: dateFilter,
  }), sort), [requests, search, statusFilter, urgencyFilter, cityFilter, propertyFilter, dateFilter, sort]);
  const activeFilterCount = [statusFilter, urgencyFilter, cityFilter, propertyFilter, dateFilter].filter((value) => value !== "All").length;
  const openDetail = (id: string) => router.push(`/landlord/maintenance-requests/${id}`);
  const warmDetail = (id: string) => router.prefetch(`/landlord/maintenance-requests/${id}`);

  useEffect(() => { markViewed("maintenance"); }, [markViewed]);

  return (
    <div className="landlord-maintenance-page w-full min-w-0 p-4 md:p-6 flex flex-col gap-6 bg-card min-h-0" aria-busy={loading}>
      <MaintenanceHeader />
      <MaintenanceSummary summary={error ? null : summary} loading={loading} />

      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(0,1fr))_auto]">
        <InputGroup className="maintenance-search w-full sm:col-span-2 xl:col-span-1">
          <InputGroup.Prefix><Search size={18} className="text-muted-foreground" aria-hidden="true" /></InputGroup.Prefix>
          <InputGroup.Input aria-label="Search maintenance requests" placeholder="Search issues, tenants, properties, or locations..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </InputGroup>
        <SettingsSelect label="Filter by property" value={propertyFilter} options={[{ value: "All", label: "All Properties" }, ...properties]} onChange={setPropertyFilter} className="w-full" />
        <SettingsSelect label="Filter by status" value={statusFilter} options={MAINTENANCE_STATUS_OPTIONS} onChange={setStatusFilter} className="w-full" />
        <SettingsSelect label="Filter by urgency" value={urgencyFilter} options={MAINTENANCE_URGENCY_OPTIONS} onChange={setUrgencyFilter} className="w-full" />
        <SettingsSelect label="Filter by reported date" value={dateFilter} options={MAINTENANCE_DATE_OPTIONS} onChange={setDateFilter} className="w-full" />
        <Dropdown>
          <Button variant="secondary" className="gap-2" aria-label="More maintenance filters"><ListFilter size={18} aria-hidden="true" />Filters{activeFilterCount > 0 ? <Chip size="sm" variant="soft" color="accent">{activeFilterCount}</Chip> : null}</Button>
          <Dropdown.Popover placement="bottom end" className="w-64">
            <div className="flex flex-col gap-3 p-3">
              <p className="text-sm font-nunito font-semibold text-foreground">Location</p>
              <SettingsSelect label="Filter by location" value={cityFilter} options={[{ value: "All", label: "All Locations" }, ...cities.map((city) => ({ value: city, label: city }))]} onChange={setCityFilter} className="w-full" />
              <Button variant="ghost" size="sm" isDisabled={activeFilterCount === 0 && !search} onPress={clearFilters}>Clear All Filters</Button>
            </div>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <section className="min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5" aria-label="Maintenance requests" onFocusCapture={(event) => {
        const row = (event.target as HTMLElement).closest<HTMLElement>("[data-request-id]");
        if (row?.dataset.requestId) warmDetail(row.dataset.requestId);
      }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {loading ? <MaintenanceCountSkeleton /> : error ? <p className="text-sm text-muted-foreground">Requests unavailable</p> : <p className="text-sm text-muted-foreground" aria-live="polite">Total <strong className="font-semibold text-card-foreground">{filtered.length}</strong> {filtered.length === 1 ? "request" : "requests"}</p>}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <SettingsSelect label="Sort maintenance requests" value={`${sort.column}:${sort.direction}`} options={MAINTENANCE_SORT_OPTIONS} onChange={(value) => {
              const [column, direction] = value.split(":");
              setSort({ column, direction: direction === "ascending" ? "ascending" : "descending" });
            }} className="w-44" />
          </div>
        </div>

        {loading ? <MaintenanceResultsSkeleton /> : error ? (
          <div role="alert" className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button size="sm" variant="secondary" onPress={() => void refresh()}>Retry</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col gap-3">
            <MaintenanceEmptyState />
            {activeFilterCount > 0 || search ? <Button variant="secondary" size="sm" className="self-center" onPress={clearFilters}>Clear Filters</Button> : null}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table className="maintenance-list-table">
                <Table.ScrollContainer className="max-w-full overflow-x-auto">
                  <Table.Content aria-label="Maintenance requests table" selectionMode="single" onRowAction={(key) => openDetail(String(key))} sortDescriptor={sort} onSortChange={(descriptor) => setSort({ column: String(descriptor.column), direction: descriptor.direction })}>
                    <Table.Header>
                      <Table.Column id="issue_title" isRowHeader>Issue</Table.Column>
                      <Table.Column id="property">Property</Table.Column>
                      <Table.Column id="location">Location</Table.Column>
                      <Table.Column id="tenant">Tenant</Table.Column>
                      <Table.Column id="reported_at" allowsSorting>{({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Reported</Table.SortableColumnHeader>}</Table.Column>
                      <Table.Column id="urgency" allowsSorting>{({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Urgency</Table.SortableColumnHeader>}</Table.Column>
                      <Table.Column id="status" allowsSorting>{({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>Status</Table.SortableColumnHeader>}</Table.Column>
                      <Table.Column id="actions">Actions</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {filtered.map((request) => {
                        const urgency = MAINTENANCE_URGENCY_STYLE[request.urgency];
                        return (
                          <Table.Row key={request.id} id={request.id} className="cursor-pointer" data-request-id={request.id} onMouseEnter={() => warmDetail(request.id)}>
                            <Table.Cell>
                              <div className="flex items-center gap-3">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Hammer size={20} aria-hidden="true" /></span>
                                <div className="min-w-0">
                                  <p className="max-w-48 truncate text-sm font-semibold text-card-foreground" title={request.issue_title}>{request.issue_title}</p>
                                  <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground" title={request.description}>{request.description || "No description provided"}</p>
                                </div>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center gap-3">
                                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={request.apartment_thumbnail_url || "/default/default-thumbnail.jpeg"} alt="" fill unoptimized className="object-cover" /></div>
                                <div className="min-w-0">
                                  <p className="max-w-44 truncate text-sm font-semibold text-card-foreground" title={request.apartment_name}>{request.apartment_name}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{request.apartment_monthly_rent != null ? `${formatPesoDisplay(request.apartment_monthly_rent)}/month` : "Rent unavailable"}</p>
                                </div>
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center gap-2"><IconMapPin size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0"><p className="text-sm text-card-foreground">{request.apartment_city || "—"}</p><p className="mt-1 max-w-36 truncate text-xs text-muted-foreground" title={request.apartment_address}>{request.apartment_address || "Address unavailable"}</p></div></div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center gap-3"><UserAvatar src={request.tenant_avatar_url} initials={getInitials(request.tenant_name)} alt={request.tenant_name} size="md" className="shrink-0" /><div className="min-w-0"><p className="max-w-36 truncate text-sm font-semibold text-card-foreground" title={request.tenant_name}>{request.tenant_name}</p><p className="mt-1 max-w-36 truncate text-xs text-muted-foreground" title={request.tenant_email ?? undefined}>{request.tenant_email || "Email unavailable"}</p></div></div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center gap-2"><Calendar size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="whitespace-nowrap text-sm text-card-foreground">{formatDate(request.reported_at, "medium")}</p><p className="mt-1 text-xs text-muted-foreground">{maintenanceReportedAge(request.reported_at)}</p></div></div>
                            </Table.Cell>
                            <Table.Cell><StatusChip size="sm" tone={urgency.tone}>{urgency.label}</StatusChip></Table.Cell>
                            <Table.Cell><StatusChip size="sm" tone={maintenanceStatusChipColor(request.status)}><span className="inline-flex items-center gap-1.5"><MaintenanceStatusIcon status={request.status} />{request.status}</span></StatusChip></Table.Cell>
                            <Table.Cell>
                              <Dropdown>
                                <Button isIconOnly variant="tertiary" size="sm" aria-label={`Actions for ${request.issue_title}`}><IconDotsVertical size={18} aria-hidden="true" /></Button>
                                <Dropdown.Popover placement="bottom end"><Dropdown.Menu aria-label="Maintenance request actions" onAction={() => openDetail(request.id)}><Dropdown.Item id="view" textValue="View request"><Label>View Request</Label></Dropdown.Item></Dropdown.Menu></Dropdown.Popover>
                              </Dropdown>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
            <div className="grid gap-3 md:hidden">
              {filtered.map((request) => {
                const urgency = MAINTENANCE_URGENCY_STYLE[request.urgency];
                return (
                  <Button variant="ghost" key={request.id} onClick={() => openDetail(request.id)} onMouseEnter={() => warmDetail(request.id)} onFocus={() => warmDetail(request.id)} className="button--bare flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left focus-visible:outline-2 focus-visible:outline-primary">
                    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Hammer size={20} aria-hidden="true" /></span><div className="min-w-0"><p className="truncate font-nunito font-semibold text-card-foreground">{request.issue_title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{request.description || "No description provided"}</p></div></div><StatusChip size="sm" tone={maintenanceStatusChipColor(request.status)} className="shrink-0">{request.status}</StatusChip></div>
                    <div className="flex items-center gap-3"><div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={request.apartment_thumbnail_url || "/default/default-thumbnail.jpeg"} alt="" fill unoptimized className="object-cover" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-card-foreground">{request.apartment_name}</p><p className="text-xs text-muted-foreground">{request.apartment_city}{request.apartment_monthly_rent != null ? ` · ${formatPesoDisplay(request.apartment_monthly_rent)}/month` : ""}</p></div></div>
                    <div className="flex min-w-0 items-center gap-2"><UserAvatar src={request.tenant_avatar_url} initials={getInitials(request.tenant_name)} alt={request.tenant_name} size="sm" /><p className="truncate text-xs text-muted-foreground">{request.tenant_name}</p></div>
                    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted-foreground">Reported {formatDate(request.reported_at, "medium")}</span><StatusChip size="sm" tone={urgency.tone}>{urgency.label}</StatusChip></div>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
