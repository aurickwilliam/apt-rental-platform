"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Chip, Dropdown, InputGroup, Separator, Spinner } from "@heroui/react";
import { ArrowLeft, ListFilter, Search } from "lucide-react";
import { formatFullName } from "@repo/utils";

import { useLandlordVisitRequests } from "@/hooks/use-landlord-visit-requests";
import type { LandlordVisitStatus } from "@/service/landlordVisitRequestsService";

import VisitRequestCard from "../components/VisitRequestCard";
import { getVisitStatusChipColor, getVisitStatusLabel } from "../lib/visit-status-styles";

const STATUS_OPTIONS: LandlordVisitStatus[] = ["pending", "rejected", "rescheduled", "cancelled"];

type DateRange = "Today" | "This Week" | "This Month";

function getDateRange(dateStr: string, todayStr: string, todayDate: Date): DateRange {
  if (dateStr === todayStr) return "Today";
  const diffDays = Math.floor(
    (new Date(dateStr).getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 7) return "This Week";
  return "This Month";
}

export default function PendingVisitRequestsPage() {
  const router = useRouter();
  const { visitRequests, loading, error, refetch } = useLandlordVisitRequests();

  const [searchQuery, setSearchQuery] = useState("");
  const [statuses, setStatuses] = useState<LandlordVisitStatus[]>([]);
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);
  const todayDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const filtered = useMemo(() => {
    let result = visitRequests.filter((r) => r.status !== "approved");
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((r) => {
        const tenantName = formatFullName({
          first_name: r.tenant.first_name,
          last_name: r.tenant.last_name,
        }).toLowerCase();
        return tenantName.includes(query) || r.apartment.name.toLowerCase().includes(query);
      });
    }
    if (statuses.length > 0) {
      result = result.filter((r) => statuses.includes(r.status));
    }
    if (dateRanges.length > 0) {
      result = result.filter((r) => dateRanges.includes(getDateRange(r.visit_date, todayStr, todayDate)));
    }
    return result;
  }, [visitRequests, searchQuery, statuses, dateRanges, todayStr, todayDate]);

  const activeCount = statuses.length + dateRanges.length;

  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onPress={() => router.back()} className="gap-1.5">
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-nunito text-card-foreground">Visit Requests</h1>
          <p className="text-sm text-muted-foreground">Requests waiting for your response.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 max-w-md">
          <InputGroup className="w-full">
            <InputGroup.Prefix>
              <Search size={16} className="text-muted-foreground" />
            </InputGroup.Prefix>
            <InputGroup.Input
              placeholder="Search tenant or apartment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </div>
        <Dropdown>
          <Button variant="tertiary" size="sm" className="gap-2">
            <ListFilter size={16} />
            Filters
            {activeCount > 0 && (
              <Chip size="sm" variant="soft" color="accent" className="ml-1">
                {activeCount}
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
                      variant={statuses.includes(s) ? "primary" : "soft"}
                      color={statuses.includes(s) ? "accent" : getVisitStatusChipColor(s)}
                      className="cursor-pointer capitalize"
                      onClick={() => setStatuses((prev) => toggle(prev, s))}
                    >
                      {getVisitStatusLabel(s)}
                    </Chip>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Date</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["Today", "This Week", "This Month"] as const).map((range) => (
                    <Chip
                      key={range}
                      size="sm"
                      variant={dateRanges.includes(range) ? "primary" : "soft"}
                      color={dateRanges.includes(range) ? "accent" : "default"}
                      className="cursor-pointer"
                      onClick={() => setDateRanges((prev) => toggle(prev, range))}
                    >
                      {range}
                    </Chip>
                  ))}
                </div>
              </div>
              {activeCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => {
                    setStatuses([]);
                    setDateRanges([]);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </Dropdown.Popover>
        </Dropdown>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner color="accent" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12">
          <p className="text-sm font-medium text-red-600">{error}</p>
          <Button size="sm" variant="outline" className="mt-3" onPress={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">Total: {filtered.length}</p>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-muted-foreground">
              <p className="text-sm font-medium">No visit requests</p>
              <p className="text-xs mt-1">New tenant visit requests will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((request) => (
                <VisitRequestCard
                  key={request.id}
                  request={request}
                  onPress={() => router.push(`/landlord/visit-requests/${request.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
