"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, Button, Chip, Dropdown, InputGroup, Separator, Table } from "@heroui/react";
import { Search, ListFilter, Hammer, Calendar } from "lucide-react";
import { formatDate, getInitials } from "@repo/utils";

import { MOCK_MAINTENANCE_REQUESTS } from "./data/mock-maintenance-requests";
import {
  MAINTENANCE_URGENCY_STYLE,
  maintenanceStatusChipColor,
  type LandlordMaintenanceStatus,
} from "./lib/maintenance-status";
import MaintenanceEmptyState from "./components/MaintenanceEmptyState";

const STATUS_OPTIONS = ["All", "Pending", "In Progress", "Resolved", "Cancelled"] as const;
const URGENCY_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "High", value: "high" },
] as const;

export default function MaintenanceRequestsPage() {
  const router = useRouter();
  // UI-first: mock data. Backend wiring will replace this with a landlord hook.
  const requests = MOCK_MAINTENANCE_REQUESTS;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LandlordMaintenanceStatus | "All">("All");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("All");
  const [cityFilter, setCityFilter] = useState<string>("All");

  const cities = useMemo(
    () => [...new Set(requests.map((r) => r.apartment_city).filter(Boolean))].sort(),
    [requests],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      const matchUrgency = urgencyFilter === "All" || r.urgency === urgencyFilter;
      const matchCity = cityFilter === "All" || r.apartment_city === cityFilter;
      const matchSearch =
        !q ||
        r.issue_title.toLowerCase().includes(q) ||
        r.apartment_name.toLowerCase().includes(q) ||
        r.tenant_name.toLowerCase().includes(q);
      return matchStatus && matchUrgency && matchCity && matchSearch;
    });
  }, [requests, search, statusFilter, urgencyFilter, cityFilter]);

  const activeFilterCount =
    (statusFilter !== "All" ? 1 : 0) + (urgencyFilter !== "All" ? 1 : 0) + (cityFilter !== "All" ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter("All");
    setUrgencyFilter("All");
    setCityFilter("All");
  };

  const openDetail = (id: string) => router.push(`/landlord/maintenance-requests/${id}`);

  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0">
      <div>
        <h1 className="text-2xl font-bold font-nunito text-card-foreground">Maintenance Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and manage tenant maintenance requests for your properties.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <InputGroup className="w-full">
            <InputGroup.Prefix>
              <Search size={16} className="text-muted-foreground" />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder="Search issues, tenants, apartments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>

        <div className="flex items-center gap-2">
          <Dropdown>
            <Button variant="tertiary" size="sm" className="gap-2">
              <ListFilter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <Chip size="sm" variant="soft" color="accent" className="ml-1">
                  {activeFilterCount}
                </Chip>
              )}
            </Button>
            <Dropdown.Popover placement="bottom end" className="w-64">
              <div className="p-3 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map((s) => (
                      <Chip
                        key={s}
                        size="sm"
                        variant={statusFilter === s ? "primary" : "soft"}
                        color={statusFilter === s ? "accent" : "default"}
                        className="cursor-pointer capitalize"
                        onClick={() => setStatusFilter(s as LandlordMaintenanceStatus | "All")}
                      >
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Urgency</p>
                  <div className="flex flex-wrap gap-1.5">
                    {URGENCY_OPTIONS.map((u) => (
                      <Chip
                        key={u.value}
                        size="sm"
                        variant={urgencyFilter === u.value ? "primary" : "soft"}
                        color={urgencyFilter === u.value ? "accent" : "default"}
                        className="cursor-pointer"
                        onClick={() => setUrgencyFilter(u.value)}
                      >
                        {u.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Location</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["All", ...cities] as const).map((c) => (
                      <Chip
                        key={c}
                        size="sm"
                        variant={cityFilter === c ? "primary" : "soft"}
                        color={cityFilter === c ? "accent" : "default"}
                        className="cursor-pointer"
                        onClick={() => setCityFilter(c)}
                      >
                        {c}
                      </Chip>
                    ))}
                  </div>
                </div>
                {activeFilterCount > 0 && (
                  <Button size="sm" variant="ghost" onPress={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Total: {filtered.length}</p>

      {filtered.length === 0 ? (
        <MaintenanceEmptyState />
      ) : (
        <>
          <div className="hidden md:block">
            <Table className="bg-card">
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="Maintenance requests table"
                  className="bg-card"
                  selectionMode="single"
                  onRowAction={(key) => openDetail(String(key))}
                >
                  <Table.Header className="bg-card">
                    <Table.Column isRowHeader className="w-14 text-card-foreground font-medium">
                      Issue
                    </Table.Column>
                    <Table.Column className="text-card-foreground font-medium">Property</Table.Column>
                    <Table.Column className="text-card-foreground font-medium">Tenant</Table.Column>
                    <Table.Column className="text-card-foreground font-medium">Reported</Table.Column>
                    <Table.Column className="text-card-foreground font-medium">Urgency</Table.Column>
                    <Table.Column className="text-card-foreground font-medium">Status</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filtered.map((request) => {
                      const urgency = MAINTENANCE_URGENCY_STYLE[request.urgency];
                      return (
                        <Table.Row
                          key={request.id}
                          id={request.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <Table.Cell>
                            <div className="flex items-center gap-2">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                <Hammer size={16} className="text-primary" />
                              </span>
                              <p className="text-sm font-medium text-card-foreground truncate max-w-44">
                                {request.issue_title}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <p className="text-sm font-medium text-card-foreground truncate max-w-40">
                              {request.apartment_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-40">
                              {request.apartment_city}
                            </p>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center gap-2">
                              <Avatar size="sm" className="shrink-0">
                                <span className="text-xs font-semibold">
                                  {getInitials(request.tenant_name)}
                                </span>
                              </Avatar>
                              <p className="text-sm text-card-foreground truncate max-w-32">
                                {request.tenant_name}
                              </p>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <p className="text-sm text-card-foreground">
                              {formatDate(request.reported_at, "medium")}
                            </p>
                          </Table.Cell>
                          <Table.Cell>
                            <Chip
                              size="sm"
                              variant="soft"
                              style={{ backgroundColor: urgency.bg, color: urgency.text }}
                              className="capitalize"
                            >
                              {urgency.label}
                            </Chip>
                          </Table.Cell>
                          <Table.Cell>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={maintenanceStatusChipColor(request.status)}
                              className="capitalize"
                            >
                              {request.status}
                            </Chip>
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
                <button
                  key={request.id}
                  onClick={() => openDetail(request.id)}
                  className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 text-left shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Hammer size={16} className="text-primary" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-nunito font-semibold text-card-foreground truncate">
                          {request.issue_title}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {request.apartment_name}
                        </p>
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={maintenanceStatusChipColor(request.status)}
                      className="capitalize shrink-0"
                    >
                      {request.status}
                    </Chip>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground truncate">
                      By {request.tenant_name}
                    </p>
                    <span className="flex items-center gap-2 shrink-0">
                      <Chip
                        size="sm"
                        variant="soft"
                        style={{ backgroundColor: urgency.bg, color: urgency.text }}
                      >
                        {urgency.label}
                      </Chip>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar size={12} />
                        {formatDate(request.reported_at, "medium")}
                      </span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
