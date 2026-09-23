"use client";

import { useState } from "react";
import { Button, Card, Chip, Modal, Spinner, useOverlayState, toast } from "@heroui/react";
import { Wrench } from "lucide-react";

import { CATEGORIES } from "../data/maintenance-data";
import {
  canCancelMaintenanceRequest,
  type MaintenanceRequest,
} from "@/hooks/use-maintenance-request-history";

const URGENCY_STYLE: Record<string, { bg: string; text: string }> = {
  low: { bg: "#E5E7EB", text: "#6C757D" },
  medium: { bg: "#FFF8E1", text: "#FACC15" },
  high: { bg: "#FDA4AF", text: "#E50914" },
};

function statusChipColor(status: MaintenanceRequest["status"]): "warning" | "success" | "default" | "accent" {
  if (status === "Pending") return "warning";
  if (status === "In Progress") return "accent";
  if (status === "Resolved") return "success";
  return "default";
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
};

export default function MaintenanceHistory({
  requests,
  loading,
  error,
  cancellingId,
  onCancel,
}: MaintenanceHistoryProps) {
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const cancelDialog = useOverlayState();

  const openCancel = (id: string) => {
    setPendingCancelId(id);
    cancelDialog.setOpen(true);
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
    <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm font-nunito">
      <Card.Content className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-1">
          <Wrench size={18} className="text-primary" />
          <h2 className="text-base font-nunito font-semibold text-zinc-900 dark:text-zinc-100">
            Your requests
          </h2>
        </div>
        <p className="text-sm text-zinc-500 mb-4">
          Track status and cancel open requests. Photos load via short-lived signed URLs.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner color="accent" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">
            No maintenance requests yet.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((request) => {
              const urgencyStyle = URGENCY_STYLE[request.urgency] ?? URGENCY_STYLE.medium;
              const cancellable = canCancelMaintenanceRequest(request.status);
              return (
                <div
                  key={request.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {request.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {categoryLabel(request.category)} ·{" "}
                        {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Chip
                        variant="soft"
                        size="sm"
                        style={{ backgroundColor: urgencyStyle.bg, color: urgencyStyle.text }}
                      >
                        {request.urgency}
                      </Chip>
                      <Chip variant="soft" size="sm" color={statusChipColor(request.status)}>
                        {request.status}
                      </Chip>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-2 whitespace-pre-line">
                    {request.message}
                  </p>

                  {request.image_urls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {request.image_urls.map((url, idx) => (
                        <a
                          key={`${request.id}-${idx}`}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block size-20 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"
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
                    <div className="mt-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 p-3">
                      <p className="text-xs text-zinc-500">
                        Resolved {new Date(request.resolved_at).toLocaleString()}
                      </p>
                      {request.resolution_notes && (
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
                          {request.resolution_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {cancellable && (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        isDisabled={cancellingId === request.id}
                        onPress={() => openCancel(request.id)}
                      >
                        {cancellingId === request.id ? "Cancelling..." : "Cancel request"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Modal isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen}>
          <Modal.Backdrop>
            <Modal.Container size="sm">
              <Modal.Dialog>
                <Modal.Header>
                  <Modal.Heading>Cancel maintenance request</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="text-sm text-muted-foreground">
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
