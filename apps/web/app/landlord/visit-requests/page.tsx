"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, InputGroup, Spinner } from "@heroui/react";
import { ArrowLeft, ChevronDown, ChevronUp, Search } from "lucide-react";
import { formatFullName } from "@repo/utils";

import { useLandlordVisitRequests, type LandlordVisitRequest } from "@/hooks/use-landlord-visit-requests";
import { useLandlordActionBadges } from "@/hooks/use-landlord-action-badges";

import VisitRequestCard from "./components/VisitRequestCard";
import VisitsCalendar from "./components/VisitsCalendar";

type Group = "Today" | "This Week" | "Next Week" | "Later" | "Past";

const GROUP_ORDER: Group[] = ["Today", "This Week", "Next Week", "Later", "Past"];

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getGroup(dateStr: string, todayStr: string, todayDate: Date): Group {
  if (dateStr === todayStr) return "Today";
  const diffDays = Math.floor(
    (new Date(dateStr).getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "Past";
  if (diffDays <= 7) return "This Week";
  if (diffDays <= 14) return "Next Week";
  return "Later";
}

export default function LandlordVisitRequestsPage() {
  const router = useRouter();
  const { visitRequests, loading, error, refetch } = useLandlordVisitRequests();
  const { markViewed } = useLandlordActionBadges();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPastExpanded, setIsPastExpanded] = useState(false);

  useEffect(() => {
    markViewed("visits");
  }, [markViewed]);

  const todayStr = useMemo(() => toISODate(new Date()), []);
  const todayDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const markedDates = useMemo(
    () => visitRequests.filter((r) => r.status === "approved").map((r) => r.resolved_visit_date),
    [visitRequests],
  );

  const pendingCount = useMemo(
    () => visitRequests.filter((r) => r.status === "pending").length,
    [visitRequests],
  );

  const filteredApproved = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return visitRequests
      .filter((r) => r.status === "approved")
      .filter((r) => {
        const tenantName = formatFullName({
          first_name: r.tenant.first_name,
          last_name: r.tenant.last_name,
        }).toLowerCase();
        const matchesSearch =
          !query || tenantName.includes(query) || r.apartment.name.toLowerCase().includes(query);
        const matchesDate = !selectedDate || r.resolved_visit_date === selectedDate;
        return matchesSearch && matchesDate;
      });
  }, [visitRequests, searchQuery, selectedDate]);

  const groups = useMemo(() => {
    const buckets = new Map<Group, LandlordVisitRequest[]>();
    GROUP_ORDER.forEach((g) => buckets.set(g, []));
    filteredApproved.forEach((r) => {
      buckets.get(getGroup(r.resolved_visit_date, todayStr, todayDate))!.push(r);
    });
    return GROUP_ORDER.flatMap((group) => {
      const requests = buckets.get(group)!;
      if (requests.length === 0) return [];
      return [{ group, requests }];
    });
  }, [filteredApproved, todayStr, todayDate]);

  const openRequest = (requestId: string) =>
    router.push(`/landlord/visit-requests/${requestId}`);

  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onPress={() => router.back()} className="gap-1.5">
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-nunito text-card-foreground">Visit Requests</h1>
          <p className="text-sm text-muted-foreground">Review and manage tenant visit requests.</p>
        </div>
      </div>

      <VisitsCalendar
        markedDates={markedDates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        pendingCount={pendingCount}
        onPendingPress={() => router.push("/landlord/visit-requests/pending")}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-card-foreground">Approved Visit Requests</h2>
        {(searchQuery || selectedDate) && (
          <p className="text-xs text-muted-foreground">
            {filteredApproved.length} result{filteredApproved.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="max-w-md">
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
      ) : filteredApproved.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-muted-foreground">
          <p className="text-sm font-medium">No approved visits</p>
          <p className="text-xs mt-1">Approved visit requests will appear here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(({ group, requests }) =>
            group === "Past" && !isPastExpanded ? (
              <button
                key={group}
                type="button"
                onClick={() => setIsPastExpanded(true)}
                className="flex items-center justify-between py-2"
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-card-foreground">Past</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {requests.length}
                  </span>
                </span>
                <ChevronDown size={20} className="text-muted-foreground" />
              </button>
            ) : (
              <div key={group} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  {group === "Past" ? (
                    <button
                      type="button"
                      onClick={() => setIsPastExpanded(false)}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm font-semibold text-card-foreground">Past</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {requests.length}
                      </span>
                      <ChevronUp size={20} className="text-muted-foreground" />
                    </button>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-card-foreground">{group}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {requests.length}
                      </span>
                    </>
                  )}
                </div>
                {requests.map((request) => (
                  <VisitRequestCard
                    key={request.id}
                    request={request}
                    useResolvedSchedule
                    onPress={() => openRequest(request.id)}
                  />
                ))}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
