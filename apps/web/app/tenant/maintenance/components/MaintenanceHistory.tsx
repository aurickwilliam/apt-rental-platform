"use client";

import { useState } from "react";
import { Button, Card, Modal, Spinner, useOverlayState, toast } from "@heroui/react";
import { IconTool as Wrench, IconHistory, IconChevronRight } from "@tabler/icons-react";
import type { StatusTone } from "@/lib/status-tone";
import { CATEGORIES } from "../data/maintenance-data";
import ActiveMaintenanceRequestCard from "./ActiveMaintenanceRequestCard";
import ActiveMaintenanceRequestsModal from "./ActiveMaintenanceRequestsModal";
import MaintenanceHistoryRow from "./MaintenanceHistoryRow";
import MaintenanceHistoryDrawer from "./MaintenanceHistoryDrawer";
import { sortActiveMaintenanceRequests } from "@/lib/maintenance-featured-request";
import { MAINTENANCE_HISTORY_PREVIEW_LIMIT, sortMaintenanceHistoryRequests } from "@/lib/maintenance-history-preview";
import { MAINTENANCE_HISTORY_LIMIT } from "@/service/maintenanceService";
import { useMaintenancePhotoUrls } from "@/hooks/use-maintenance-photo-urls";
import { canCancelMaintenanceRequest, type MaintenanceRequest } from "@/hooks/use-maintenance-request-history";
import EmptyState from "@/app/components/display/EmptyState";
import { emptyHistoryFilters, filterMaintenanceHistory } from "@repo/utils/maintenance-history";

const URGENCY_STYLE: Record<string, { tone: StatusTone }> = {
  low: { tone: "neutral" },
  medium: { tone: "warning" },
  high: { tone: "danger" },
};

function statusChipColor(status: MaintenanceRequest["status"]): StatusTone {
  if (status === "Pending" || status === "In Progress") return "warning";
  if (status === "Resolved") return "success";
  return "danger";
}

function categoryLabel(value: string) {
  return CATEGORIES.find((category) => category.id === value)?.label ?? value;
}

interface MaintenanceHistoryProps {
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;
  cancellingId: string | null;
  onCancel: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  kind?: "active" | "history";
  onRetry?: () => void;
}

export default function MaintenanceHistory({ requests, loading, error, cancellingId, onCancel, kind = "active", onRetry }: MaintenanceHistoryProps) {
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [allOpen, setAllOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [filters, setFilters] = useState(emptyHistoryFilters);
  const isHistory = kind === "history";
  const activeRequests = isHistory ? [] : sortActiveMaintenanceRequests(requests);
  const allHistoryRequests = isHistory ? sortMaintenanceHistoryRequests(requests) : [];
  const historyRequests = filterMaintenanceHistory(allHistoryRequests, filters);
  const applyFilters = (next: typeof filters) => {
    setFilters(next);
    setExpandedIds(new Set());
  };
  const visibleRequests = isHistory ? allHistoryRequests.slice(0, MAINTENANCE_HISTORY_PREVIEW_LIMIT) : activeRequests.slice(0, 1);
  const photoRequests = isHistory ? (historyOpen ? historyRequests : visibleRequests) : (allOpen ? activeRequests : visibleRequests);
  const cancelDialog = useOverlayState();
  const photos = useMaintenancePhotoUrls(!loading && !error
    ? photoRequests.filter((request) => !isHistory || expandedIds.has(request.id)).flatMap((request) => request.image_paths ?? [])
    : []);

  const openCancel = (id: string) => {
    setPendingCancelId(id);
    cancelDialog.setOpen(true);
  };
  const imageUrlsFor = (request: MaintenanceRequest) => request.image_paths?.length
    ? request.image_paths.map((path) => photos.urls[path]).filter((url): url is string => !!url)
    : request.image_urls;

  const renderActiveRequest = (request: MaintenanceRequest, onRequestCancel: () => void) => (
    <ActiveMaintenanceRequestCard key={request.id} request={request} category={categoryLabel(request.category)} imageUrls={imageUrlsFor(request)} urgencyTone={(URGENCY_STYLE[request.urgency] ?? URGENCY_STYLE.medium).tone} statusTone={statusChipColor(request.status)} cancellable={canCancelMaintenanceRequest(request.status)} cancelling={cancellingId === request.id} onCancel={onRequestCancel} />
  );
  const renderHistoryRequest = (request: MaintenanceRequest) => (
    <MaintenanceHistoryRow key={request.id} request={request} category={categoryLabel(request.category)} imageUrls={imageUrlsFor(request)} urgencyTone={(URGENCY_STYLE[request.urgency] ?? URGENCY_STYLE.medium).tone} statusTone={statusChipColor(request.status)} expanded={expandedIds.has(request.id)} onExpandedChange={(open) => setExpandedIds((previous) => {
      const next = new Set(previous);
      if (open) next.add(request.id);
      else next.delete(request.id);
      return next;
    })} />
  );

  const confirmCancel = async () => {
    if (!pendingCancelId) return;
    const result = await onCancel(pendingCancelId);
    if (result.success) {
      toast.success("Maintenance request cancelled");
      cancelDialog.setOpen(false);
      setPendingCancelId(null);
    } else {
      toast.danger(result.error ?? "Couldn't cancel this request.");
    }
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <Card.Content style={{ padding: 4 }}>
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{isHistory ? <IconHistory size={24} aria-hidden="true" /> : <Wrench size={24} aria-hidden="true" />}</span>
            <div className="min-w-0">
              <h2 className="font-nunito text-xl font-bold text-card-foreground">{isHistory ? "Maintenance request history" : "Active maintenance requests"}</h2>
              <p className="mt-1 font-inter text-sm text-muted-foreground">{isHistory ? "Review your resolved and cancelled requests." : "Track your pending and in-progress requests."}</p>
            </div>
          </div>
          {!isHistory && activeRequests.length > 1 && !loading && !error ? (
            <Button variant="secondary" className="ml-auto shrink-0 self-end" onPress={() => setAllOpen(true)}>{activeRequests.length >= MAINTENANCE_HISTORY_LIMIT ? `View active requests (${activeRequests.length}+)` : `View all active requests (${activeRequests.length})`}</Button>
          ) : null}
        </div>
        {isHistory && allHistoryRequests.length >= MAINTENANCE_HISTORY_LIMIT && !loading && !error ? <p className="mb-3 text-xs text-muted-foreground">History is limited to the latest {MAINTENANCE_HISTORY_LIMIT} requests. Filters apply to these loaded requests.</p> : null}
        {photos.loading ? <p role="status" className="text-xs text-muted-foreground">Loading request photos…</p> : null}
        {photos.error ? <p role="alert" className="text-xs text-danger">{photos.error}</p> : null}
        {loading ? <div className="flex justify-center py-4"><Spinner color="accent" /></div> : error ? (
          <div className="space-y-3" role="alert"><p className="font-inter text-sm text-danger">{error}</p>{onRetry ? <Button variant="outline" size="sm" onPress={onRetry}>Retry requests</Button> : null}</div>
        ) : visibleRequests.length === 0 ? (
          <EmptyState
            className="py-4"
            icon={isHistory ? IconHistory : Wrench}
            title={isHistory ? "No resolved or cancelled requests yet." : "No active maintenance requests"}
            description={isHistory ? "Your completed and cancelled requests will appear here." : "Need a repair? Select Request Maintenance above."}
          />
        ) : (
          <div className={isHistory ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
            {visibleRequests.map((request) => isHistory ? renderHistoryRequest(request) : renderActiveRequest(request, () => openCancel(request.id)))}
          </div>
        )}
        {isHistory && allHistoryRequests.length > MAINTENANCE_HISTORY_PREVIEW_LIMIT && !loading && !error ? (
          <div className="mt-4 flex justify-end"><Button variant="secondary" onPress={() => { setExpandedIds(new Set()); setHistoryOpen(true); }}>See more<IconChevronRight size={18} aria-hidden="true" /></Button></div>
        ) : null}
        {isHistory ? (
          <MaintenanceHistoryDrawer isOpen={historyOpen} onOpenChange={(open) => { setHistoryOpen(open); if (!open) setExpandedIds(new Set()); }} requests={historyRequests} filters={filters} onApplyFilters={applyFilters} loading={loading} error={error} photoLoading={photos.loading} photoError={photos.error} limitReached={allHistoryRequests.length >= MAINTENANCE_HISTORY_LIMIT} onRetry={onRetry} renderRequest={renderHistoryRequest} />
        ) : (
          <ActiveMaintenanceRequestsModal isOpen={allOpen} onOpenChange={setAllOpen} requests={activeRequests} loading={loading} error={error} photoLoading={photos.loading} photoError={photos.error} onRetry={onRetry} onCancel={onCancel} renderRequest={renderActiveRequest} />
        )}
        <Modal isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen}>
          <Modal.Backdrop>
            <Modal.Container size="sm">
              <Modal.Dialog>
                <Modal.Header><Modal.Heading>Cancel maintenance request</Modal.Heading></Modal.Header>
                <Modal.Body><p className="font-inter text-sm text-muted-foreground">Are you sure you want to cancel this request? This cannot be undone.</p></Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onPress={() => cancelDialog.setOpen(false)}>Keep</Button>
                  <Button variant="danger" size="sm" onPress={confirmCancel}>Yes, Cancel</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </Card.Content>
    </Card>
  );
}
