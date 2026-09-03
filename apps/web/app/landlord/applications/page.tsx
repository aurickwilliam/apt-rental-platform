"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, Button, Chip, Dropdown, InputGroup, Separator, Table } from "@heroui/react";
import { Search, ListFilter, Calendar, Home } from "lucide-react";

import {
  MOCK_APPLICATIONS,
  CAMANAVA_CITIES,
  formatPeso,
  formatDate,
  getInitials,
  statusChipColor,
  type DisplayStatus,
} from "./lib/mockApplications";

const formatDateMedium = formatDate;

export default function ApplicationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DisplayStatus | "All">("All");
  const [cityFilter, setCityFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_APPLICATIONS.filter((a) => {
      const matchStatus = statusFilter === "All" || a.status === statusFilter;
      const matchCity = cityFilter === "All" || a.apartment_city === cityFilter;
      const matchSearch =
        !q ||
        a.tenant_name.toLowerCase().includes(q) ||
        a.apartment_name.toLowerCase().includes(q);
      return matchStatus && matchCity && matchSearch;
    });
  }, [search, statusFilter, cityFilter]);

  const activeFilterCount = (statusFilter !== "All" ? 1 : 0) + (cityFilter !== "All" ? 1 : 0);

  const openDetail = (id: string) => router.push(`/landlord/applications/${id}`);

  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0">
      <div>
        <h1 className="text-2xl font-bold font-nunito text-card-foreground">Applications</h1>
        <p className="mt-1 text-sm text-muted-foreground">View and manage tenant applications — mock data for UI testing.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <InputGroup className="w-full">
            <InputGroup.Prefix>
              <Search size={16} className="text-muted-foreground" />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder="Search by tenant or property"
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
                    {(["All", "Applied", "Approved", "Rejected", "Cancelled"] as const).map((s) => (
                      <Chip
                        key={s}
                        size="sm"
                        variant={statusFilter === s ? "primary" : "soft"}
                        color={statusFilter === s ? "accent" : "default"}
                        className="cursor-pointer capitalize"
                        onClick={() => setStatusFilter(s as DisplayStatus | "All")}
                      >
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Location</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(["All", ...CAMANAVA_CITIES] as const).map((c) => (
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      setStatusFilter("All");
                      setCityFilter("All");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Total: {filtered.length}</p>

      <div className="hidden md:block">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-muted-foreground">
            <p className="text-sm font-medium">No applications found</p>
            <p className="text-xs mt-1">Try adjusting search or filters</p>
          </div>
        ) : (
          <Table className="bg-card">
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Applications table"
                className="bg-card"
                selectionMode="single"
                onRowAction={(key) => openDetail(String(key))}
              >
                <Table.Header className="bg-card">
                  <Table.Column className="w-14 text-card-foreground font-medium">Tenant</Table.Column>
                  <Table.Column className="text-card-foreground font-medium">Property</Table.Column>
                  <Table.Column className="text-card-foreground font-medium">Location</Table.Column>
                  <Table.Column className="text-card-foreground font-medium">Date</Table.Column>
                  <Table.Column className="text-card-foreground font-medium">Status</Table.Column>
                </Table.Header>
                <Table.Body>
                  {filtered.map((app) => (
                    <Table.Row key={app.id} id={app.id} className="cursor-pointer hover:bg-muted/50">
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <Avatar size="sm" className="shrink-0">
                            {app.tenant_avatar_url ? (
                              <img src={app.tenant_avatar_url} alt={app.tenant_name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-semibold">{getInitials(app.tenant_name)}</span>
                            )}
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate max-w-32">{app.tenant_name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-32">{app.tenant_email}</p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-sm font-medium text-card-foreground truncate max-w-40">{app.apartment_name}</p>
                        <p className="text-xs text-muted-foreground">{formatPeso(app.monthly_rent)}/mo</p>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-sm text-card-foreground">{app.apartment_city}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-32">{app.apartment_address}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <p className="text-sm text-card-foreground">{formatDate(app.created_at)}</p>
                        <p className="text-xs text-muted-foreground">Move: {formatDate(app.move_in_date)}</p>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip size="sm" variant="soft" color={statusChipColor(app.status)} className="capitalize">
                          {app.status}
                        </Chip>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-10 text-muted-foreground">
            <p className="text-sm font-medium">No applications found</p>
            <p className="text-xs mt-1">Try adjusting search or filters</p>
          </div>
        ) : (
          filtered.map((app) => (
            <button
              key={app.id}
              onClick={() => openDetail(app.id)}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 text-left shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar size="lg" className="shrink-0">
                    {app.tenant_avatar_url ? (
                      <img src={app.tenant_avatar_url} alt={app.tenant_name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-semibold">{getInitials(app.tenant_name)}</span>
                    )}
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-nunito font-semibold text-card-foreground truncate">{app.tenant_name}</p>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <Home size={12} className="shrink-0" />
                      {app.apartment_name}
                    </p>
                  </div>
                </div>
                <Chip size="sm" variant="soft" color={statusChipColor(app.status)} className="capitalize shrink-0">
                  {app.status}
                </Chip>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={12} />
                Submitted {formatDateMedium(app.created_at)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
