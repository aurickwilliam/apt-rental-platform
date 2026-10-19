"use client";

import { Suspense, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Chip, Dropdown, InputGroup, Label, Table } from "@heroui/react";
import { IconSearch as Search, IconFilter as ListFilter, IconCalendar as Calendar, IconHome as Home, IconMapPin, IconDotsVertical, IconCircleCheck, IconX, IconClock } from "@tabler/icons-react";
import { formatDate, formatPesoDisplay, getInitials } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useLandlordApplications, type DisplayStatus } from "@/hooks/use-landlord-applications";
import { statusChipColor } from "./lib/application-status";
import { APPLICATION_DATE_OPTIONS, APPLICATION_SORT_OPTIONS, APPLICATION_STATUS_OPTIONS, applicationStatusLabel, applicationSummary, filterApplicationList, sortApplicationList } from "./lib/application-list";
import useApplicationListFilters from "./lib/use-application-list-filters";
import ApplicationsHeader from "./components/ApplicationsHeader";
import ApplicationsSummary from "./components/ApplicationsSummary";
import ApplicationsSkeleton, { ApplicationsCountSkeleton, ApplicationsResultsSkeleton, ApplicationsSummarySkeleton } from "./components/ApplicationsSkeleton";

export type { DisplayStatus };

function StatusIcon({ status }: { status: DisplayStatus }) {
  const Icon = status === "Approved" ? IconCircleCheck : status === "Applied" ? IconClock : IconX;
  return <Icon size={15} aria-hidden="true" />;
}

export default function ApplicationsPage() {
  return <Suspense fallback={<ApplicationsSkeleton />}><ApplicationsContent /></Suspense>;
}

function ApplicationsContent() {
  const router = useRouter();
  const { applications, loading, error, refresh } = useLandlordApplications();
  const { search, statusFilter, cityFilter, propertyFilter, dateFilter, sort,
    setSearch, setStatusFilter, setCityFilter, setPropertyFilter, setDateFilter, setSort, clearFilters } = useApplicationListFilters();

  const cities = useMemo(() => [...new Set(applications.map((application) => application.apartment_city).filter(Boolean))].sort(), [applications]);
  const properties = useMemo(() => [...new Map(applications.map((application) => [application.apartment_id, { value: application.apartment_id, label: application.apartment_name }])).values()].sort((a, b) => a.label.localeCompare(b.label)), [applications]);
  const summary = useMemo(() => applicationSummary(applications), [applications]);
  const filtered = useMemo(() => sortApplicationList(filterApplicationList(applications, {
    search, status: statusFilter, city: cityFilter, property: propertyFilter, days: dateFilter,
  }), sort), [applications, search, statusFilter, cityFilter, propertyFilter, dateFilter, sort]);
  const activeFilterCount = [statusFilter, cityFilter, propertyFilter, dateFilter].filter((value) => value !== "All").length;
  const openDetail = (id: string) => router.push(`/landlord/applications/${id}`);

  return (
    <div className="landlord-applications-page w-full min-w-0 p-4 flex flex-col gap-6 bg-card min-h-0" aria-busy={loading}>
      <ApplicationsHeader />

      {loading ? <ApplicationsSummarySkeleton /> : <ApplicationsSummary summary={error ? null : summary} />}

      <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,2fr)_repeat(4,minmax(0,1fr))_auto]">
        <InputGroup className="application-search w-full sm:col-span-2 xl:col-span-1">
          <InputGroup.Prefix><Search size={18} className="text-muted-foreground" aria-hidden="true" /></InputGroup.Prefix>
          <InputGroup.Input aria-label="Search applications" placeholder="Search by tenant, property, or location..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </InputGroup>
        <SettingsSelect label="Filter by status" value={statusFilter} options={APPLICATION_STATUS_OPTIONS} onChange={setStatusFilter} className="w-full" />
        <SettingsSelect label="Filter by property" value={propertyFilter} options={[{ value: "All", label: "All Properties" }, ...properties]} onChange={setPropertyFilter} className="w-full" />
        <SettingsSelect label="Filter by location" value={cityFilter} options={[{ value: "All", label: "All Locations" }, ...cities.map((city) => ({ value: city, label: city }))]} onChange={setCityFilter} className="w-full" />
        <SettingsSelect label="Filter by submission date" value={dateFilter} options={APPLICATION_DATE_OPTIONS} onChange={setDateFilter} className="w-full" />
        <Dropdown>
          <Button variant="secondary" aria-label="Quick application filters" className="gap-2">
            <ListFilter size={18} aria-hidden="true" /> Filters
            {activeFilterCount > 0 ? <Chip size="sm" variant="soft" color="accent">{activeFilterCount}</Chip> : null}
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu aria-label="Quick application filters" onAction={(key) => {
              if (key === "clear") clearFilters();
              else setStatusFilter(String(key));
            }}>
              <Dropdown.Item id="Applied" textValue="Show pending"><Label>Show Pending</Label></Dropdown.Item>
              <Dropdown.Item id="Approved" textValue="Show approved"><Label>Show Approved</Label></Dropdown.Item>
              <Dropdown.Item id="Rejected" textValue="Show rejected"><Label>Show Rejected</Label></Dropdown.Item>
              <Dropdown.Item id="clear" textValue="Clear all filters" isDisabled={activeFilterCount === 0 && !search}><Label>Clear All Filters</Label></Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      <section className="application-results-panel min-w-0 rounded-2xl border border-border bg-card p-4 md:p-5" aria-label="Tenant applications" onFocusCapture={(event) => {
        const row = (event.target as HTMLElement).closest<HTMLElement>("[data-application-id]");
        if (row?.dataset.applicationId) router.prefetch(`/landlord/applications/${row.dataset.applicationId}`);
      }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {loading ? <ApplicationsCountSkeleton /> : error ? <p className="text-sm text-muted-foreground">Applications unavailable</p> : (
            <p className="text-sm text-muted-foreground" aria-live="polite">Total <strong className="font-semibold text-card-foreground">{filtered.length}</strong> {filtered.length === 1 ? "application" : "applications"}</p>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort by</span>
            <SettingsSelect label="Sort applications" value={`${sort.column}:${sort.direction}`} options={APPLICATION_SORT_OPTIONS} onChange={(value) => {
              const [column, direction] = value.split(":");
              setSort({ column, direction: direction === "ascending" ? "ascending" : "descending" });
            }} className="w-44" />
          </div>
        </div>

        {loading ? <ApplicationsResultsSkeleton /> : error ? (
          <div role="alert" className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button variant="secondary" onPress={() => void refresh()}>Try Again</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Home size={32} className="text-primary" aria-hidden="true" />
            <p className="text-base font-nunito font-semibold text-card-foreground">No applications found</p>
            <p className="text-sm">{applications.length === 0 ? "Tenant applications for your properties will appear here." : "Try adjusting search or filters."}</p>
            {activeFilterCount > 0 || search ? <Button variant="secondary" size="sm" onPress={clearFilters}>Clear Filters</Button> : null}
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table className="application-list-table">
                <Table.ScrollContainer className="max-w-full overflow-x-auto">
                  <Table.Content aria-label="Applications table" selectionMode="single" onRowAction={(key) => openDetail(String(key))} sortDescriptor={sort} onSortChange={(descriptor) => setSort({ column: String(descriptor.column), direction: descriptor.direction })}>
                    <Table.Header>
                      <Table.Column id="tenant_name" isRowHeader allowsSorting>Tenant</Table.Column>
                      <Table.Column id="apartment_name" allowsSorting>Property</Table.Column>
                      <Table.Column id="apartment_city" allowsSorting>Location</Table.Column>
                      <Table.Column id="created_at" allowsSorting>Date</Table.Column>
                      <Table.Column id="status" allowsSorting>Status</Table.Column>
                      <Table.Column id="actions">Actions</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {filtered.map((app) => (
                        <Table.Row key={app.id} id={app.id} className="cursor-pointer" data-application-id={app.id} onMouseEnter={() => router.prefetch(`/landlord/applications/${app.id}`)}>
                          <Table.Cell>
                            <div className="flex items-center gap-3">
                              <UserAvatar src={app.tenant_avatar_url} initials={getInitials(app.tenant_name)} alt={app.tenant_name} size="md" className="shrink-0" />
                              <div className="min-w-0">
                                <p className="max-w-44 truncate text-sm font-semibold text-card-foreground" title={app.tenant_name}>{app.tenant_name}</p>
                                <p className="mt-1 max-w-44 truncate text-xs text-muted-foreground" title={app.tenant_email ?? undefined}>{app.tenant_email ?? "—"}</p>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center gap-3">
                              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image src={app.apartment_thumbnail_url || "/default/default-thumbnail.jpeg"} alt="" fill unoptimized className="object-cover" />
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-48 truncate text-sm font-semibold text-card-foreground" title={app.apartment_name}>{app.apartment_name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{formatPesoDisplay(app.monthly_rent)}/month</p>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center gap-3">
                              <IconMapPin size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                              <div className="min-w-0">
                                <p className="text-sm text-card-foreground">{app.apartment_city}</p>
                                <p className="mt-1 max-w-44 truncate text-xs text-muted-foreground" title={app.apartment_address}>{app.apartment_address}</p>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center gap-3">
                              <Calendar size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                              <div>
                                <p className="whitespace-nowrap text-sm text-card-foreground">{formatDate(app.move_in_date, "medium")}</p>
                                <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">Submitted: {formatDate(app.created_at, "medium")}</p>
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell><StatusChip size="sm" tone={statusChipColor(app.status)}><span className="inline-flex items-center gap-1.5"><StatusIcon status={app.status} />{applicationStatusLabel(app.status)}</span></StatusChip></Table.Cell>
                          <Table.Cell>
                            <Dropdown>
                              <Button isIconOnly variant="tertiary" size="sm" aria-label={`Actions for ${app.tenant_name}'s application`}><IconDotsVertical size={18} aria-hidden="true" /></Button>
                              <Dropdown.Popover placement="bottom end">
                                <Dropdown.Menu aria-label="Application actions" onAction={() => openDetail(app.id)}>
                                  <Dropdown.Item id="view" textValue="View application"><Label>View Application</Label></Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown.Popover>
                            </Dropdown>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            </div>
            <div className="grid gap-3 md:hidden">
              {filtered.map((app) => (
                <button key={app.id} type="button" onClick={() => openDetail(app.id)} onMouseEnter={() => router.prefetch(`/landlord/applications/${app.id}`)} onFocus={() => router.prefetch(`/landlord/applications/${app.id}`)} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-left focus-visible:outline-2 focus-visible:outline-primary">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <UserAvatar src={app.tenant_avatar_url} initials={getInitials(app.tenant_name)} alt={app.tenant_name} size="md" className="shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-nunito font-semibold text-card-foreground">{app.tenant_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{app.tenant_email ?? "—"}</p>
                      </div>
                    </div>
                    <StatusChip size="sm" tone={statusChipColor(app.status)} className="shrink-0"><span className="inline-flex items-center gap-1.5"><StatusIcon status={app.status} />{applicationStatusLabel(app.status)}</span></StatusChip>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted"><Image src={app.apartment_thumbnail_url || "/default/default-thumbnail.jpeg"} alt="" fill unoptimized className="object-cover" /></div>
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-card-foreground">{app.apartment_name}</p><p className="text-xs text-muted-foreground">{formatPesoDisplay(app.monthly_rent)}/month · {app.apartment_city}</p></div>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar size={14} aria-hidden="true" />Submitted {formatDate(app.created_at, "medium")}</p>
                  <p className="text-xs text-muted-foreground">Move-in: {formatDate(app.move_in_date, "medium")}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
