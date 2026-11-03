"use client";

import { useState } from "react";
import { Button, Card, Disclosure, Modal, Spinner, useOverlayState, toast } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";
import { IconTool as Wrench, IconChevronRight, IconChevronUp, IconStack, IconCalendarEvent, IconBolt, IconLeaf, IconCircleCheck, IconCircleX } from "@tabler/icons-react";

import { CATEGORIES } from "../data/maintenance-data";
import ActiveMaintenanceRequestCard from "./ActiveMaintenanceRequestCard";
import ActiveMaintenanceRequestsModal from "./ActiveMaintenanceRequestsModal";
import { sortActiveMaintenanceRequests } from "@/lib/maintenance-featured-request";
import { MAINTENANCE_HISTORY_LIMIT } from "@/service/maintenanceService";
import { useMaintenancePhotoUrls } from "@/hooks/use-maintenance-photo-urls";
import {
  canCancelMaintenanceRequest,
  type MaintenanceRequest,
} from "@/hooks/use-maintenance-request-history";

// Same tones as mobile's useMaintenanceRequestUrgencyStyles.
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
  return CATEGORIES.find((c) => c.id === value)?.label ?? value;
}

type MaintenanceHistoryProps = {
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;
  cancellingId: string | null;
  onCancel: (requestId: string) => Promise<{ success: boolean; error?: string }>;
  kind?: "active" | "history";
  onRetry?: () => void;
};

export default function MaintenanceHistory({
  requests,
  loading,
  error,
  cancellingId,
  onCancel,
  kind = "active",
  onRetry,
}: MaintenanceHistoryProps) {
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const [allOpen, setAllOpen] = useState(false);
  const isHistory = kind === "history";
  const activeRequests = isHistory ? [] : sortActiveMaintenanceRequests(requests);
  const visibleRequests = isHistory ? requests : activeRequests.slice(0, 1);
  const cancelDialog = useOverlayState();
  const photos = useMaintenancePhotoUrls(!loading && !error
    ? (allOpen && !isHistory ? activeRequests : visibleRequests).filter((request) => !isHistory || expandedIds.has(request.id)).flatMap((request) => request.image_paths ?? [])
    : []);

  const openCancel = (id: string) => {
    setPendingCancelId(id);
    cancelDialog.setOpen(true);
  };

  const renderActiveRequest = (request: MaintenanceRequest, onRequestCancel: () => void) => {
    const imageUrls = request.image_paths?.length
      ? request.image_paths.map((path) => photos.urls[path]).filter((url): url is string => !!url)
      : request.image_urls;
    return <ActiveMaintenanceRequestCard key={request.id} request={request} category={categoryLabel(request.category)} imageUrls={imageUrls} urgencyTone={(URGENCY_STYLE[request.urgency] ?? URGENCY_STYLE.medium).tone} statusTone={statusChipColor(request.status)} cancellable={canCancelMaintenanceRequest(request.status)} cancelling={cancellingId === request.id} onCancel={onRequestCancel} />;
  };

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
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wrench size={24} aria-hidden="true" /></span>
            <div className="min-w-0">
              <h2 className="font-nunito text-xl font-bold text-card-foreground">{isHistory ? "Maintenance request history" : "Active maintenance requests"}</h2>
              <p className="mt-1 font-inter text-sm text-muted-foreground">{isHistory ? "Review your resolved and cancelled requests." : "Track your pending and in-progress requests."}</p>
            </div>
          </div>
          {!isHistory && activeRequests.length > 1 && !loading && !error ? (
            <Button variant="secondary" className="ml-auto shrink-0 self-end" onPress={() => setAllOpen(true)}>{activeRequests.length >= MAINTENANCE_HISTORY_LIMIT ? `View active requests (${activeRequests.length}+)` : `View all active requests (${activeRequests.length})`}</Button>
          ) : null}
        </div>
        {photos.loading ? <p role="status" className="text-xs text-muted-foreground">Loading request photos…</p> : null}
        {photos.error ? <p role="alert" className="text-xs text-danger">{photos.error}</p> : null}

        {loading ? (
          <div className="flex justify-center py-4">
            <Spinner color="accent" />
          </div>
        ) : error ? (
          <div className="space-y-3" role="alert">
            <p className="font-inter text-sm text-danger">{error}</p>
            {onRetry ? <Button variant="outline" size="sm" onPress={onRetry}>Retry requests</Button> : null}
          </div>
        ) : visibleRequests.length === 0 ? (
          <p className="font-inter text-sm text-muted-foreground text-center py-2">
            {kind === "active" ? "No active maintenance requests. Need a repair? Select Request Maintenance above." : "No resolved or cancelled requests yet."}
          </p>
        ) : (
          <div className={isHistory ? "flex flex-col gap-2" : "flex flex-col gap-3"}>
            {visibleRequests.map((request) => {
              if (!isHistory) return renderActiveRequest(request, () => openCancel(request.id));
              const imageUrls = request.image_paths?.length
                ? request.image_paths.map((path) => photos.urls[path]).filter((url): url is string => !!url)
                : request.image_urls;
              const urgencyStyle = URGENCY_STYLE[request.urgency] ?? URGENCY_STYLE.medium;
              const expanded = expandedIds.has(request.id);
              const UrgencyIcon = request.urgency === "low" ? IconLeaf : IconBolt;
              const StatusIcon = request.status === "Resolved" ? IconCircleCheck : IconCircleX;
              return (
                <Disclosure
                  key={request.id}
                  className="rounded-xl border border-border p-4 shadow-sm"
                  style={{ background: "color-mix(in srgb, var(--primary) 3%, var(--card))" }}
                  isExpanded={expanded}
                  onExpandedChange={(open: boolean) => setExpandedIds((previous) => {
                      const next = new Set(previous);
                      if (open) next.add(request.id);
                      else next.delete(request.id);
                      return next;
                  })}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 basis-72">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 h-6 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        <p className="min-w-0 break-words font-nunito text-lg font-bold text-card-foreground">{request.title}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-5 font-inter text-sm text-muted-foreground">
                        <span className="flex min-w-0 items-center gap-2"><IconStack size={18} className="shrink-0" aria-hidden="true" />{categoryLabel(request.category)}</span>
                        <span className="hidden h-4 border-l border-border sm:block" aria-hidden="true" />
                        <span className="flex items-center gap-2"><IconCalendarEvent size={18} className="shrink-0" aria-hidden="true" /><time dateTime={request.created_at}>{new Date(request.created_at).toLocaleString()}</time></span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusChip
                        size="md"
                        tone={urgencyStyle.tone}
                        className="font-nunito font-semibold"
                      >
                        <span className="flex items-center gap-1.5 capitalize"><UrgencyIcon size={18} aria-hidden="true" />{request.urgency}</span>
                      </StatusChip>
                      <StatusChip size="md" tone={statusChipColor(request.status)} className="font-nunito font-semibold">
                        <span className="flex items-center gap-1.5"><StatusIcon size={18} aria-hidden="true" />{request.status}</span>
                      </StatusChip>
                      <span className="hidden h-8 border-l border-border sm:block" aria-hidden="true" />
                        <Disclosure.Heading>
                          <Button
                            slot="trigger"
                            variant="secondary"
                            aria-label={`${expanded ? "Hide" : "View"} details for ${request.title}`}
                            className="rounded-xl! font-nunito font-bold"
                          >
                            <span className="flex items-center gap-2">
                              {expanded ? "Hide details" : "View details"}
                              {expanded ? <IconChevronUp size={18} aria-hidden="true" /> : <IconChevronRight size={18} aria-hidden="true" />}
                            </span>
                          </Button>
                        </Disclosure.Heading>
                    </div>
                  </div>

                  <Disclosure.Content>
                  {expanded ? <div>
                  <p className="font-inter text-sm text-muted-foreground mt-2 whitespace-pre-line">
                    {request.message}
                  </p>

                  {imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {imageUrls.map((url, idx) => (
                        <a
                          key={`${request.id}-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block size-20 rounded-lg overflow-hidden border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Issue photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}

                  {request.resolved_at && (
                    <div className="mt-3 rounded-lg bg-muted p-3">
                      <p className="font-inter text-xs text-muted-foreground">
                        Resolved {new Date(request.resolved_at).toLocaleString()}
                      </p>
                      {request.resolution_notes && (
                        <p className="font-inter text-sm text-card-foreground mt-1">
                          {request.resolution_notes}
                        </p>
                      )}
                    </div>
                  )}

                  </div> : null}
                  </Disclosure.Content>
                </Disclosure>
              );
            })}
          </div>
        )}

        {isHistory && requests.length >= MAINTENANCE_HISTORY_LIMIT && !loading && !error ? (
          <p className="mt-4 text-xs text-muted-foreground">Showing the latest {MAINTENANCE_HISTORY_LIMIT} resolved and cancelled requests.</p>
        ) : null}

        {!isHistory ? <ActiveMaintenanceRequestsModal isOpen={allOpen} onOpenChange={setAllOpen} requests={activeRequests} loading={loading} error={error} photoLoading={photos.loading} photoError={photos.error} onRetry={onRetry} onCancel={onCancel} renderRequest={renderActiveRequest} /> : null}

        <Modal isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen}>
          <Modal.Backdrop>
            <Modal.Container size="sm">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Cancel maintenance request</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="font-inter text-sm text-muted-foreground">
                    Are you sure you want to cancel this request? This cannot be undone.
                  </p>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onPress={() => cancelDialog.setOpen(false)}>
                    Keep
                  </Button>
                  <Button variant="danger" size="sm" onPress={confirmCancel}>
                    Yes, Cancel
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      </Card.Content>
    </Card>
  );
}

