"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Modal, Spinner, toast } from "@heroui/react";
import type { MaintenanceRequest } from "@/service/maintenanceService";
import { MAINTENANCE_HISTORY_LIMIT } from "@/service/maintenanceService";

interface ActiveMaintenanceRequestsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;
  photoLoading: boolean;
  photoError: string | null;
  onRetry?: () => void;
  onCancel: (id: string) => Promise<{ success: boolean; error?: string }>;
  renderRequest: (request: MaintenanceRequest, onCancel: () => void) => ReactNode;
}

export default function ActiveMaintenanceRequestsModal({ isOpen, onOpenChange, requests, loading, error, photoLoading, photoError, onRetry, onCancel, renderRequest }: ActiveMaintenanceRequestsModalProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const pending = requests.find((request) => request.id === pendingId);
  const handleOpenChange = (open: boolean) => {
    if (lock.current) return;
    if (!open) setPendingId(null);
    onOpenChange(open);
  };
  const confirmCancel = async () => {
    if (lock.current || !pending) return;
    lock.current = true;
    setSaving(true);
    try {
      const result = await onCancel(pending.id);
      if (!mounted.current) return;
      if (result.success) {
        setPendingId(null);
        toast.success("Maintenance request cancelled");
      } else {
        toast.danger(result.error ?? "Couldn't cancel this request.");
      }
    } catch (failure) {
      if (mounted.current) {
        console.error("Maintenance cancellation failed:", failure instanceof Error ? failure.name : typeof failure);
        toast.danger("Couldn't cancel this request. Please try again.");
      }
    } finally {
      lock.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop isDismissable={!saving} isKeyboardDismissDisabled={saving}>
        <Modal.Container size="lg" scroll="inside" placement="center">
          <Modal.Dialog className="w-full max-w-5xl!">
            <Modal.CloseTrigger aria-label="Close active maintenance requests" isDisabled={saving} />
            <Modal.Header>
              <Modal.Heading className="font-nunito text-xl font-bold text-foreground">All active maintenance requests</Modal.Heading>
              <p className="mt-1 text-sm text-muted-foreground">In Progress requests appear first, followed by your newest pending requests.</p>
            </Modal.Header>
            <Modal.Body className="space-y-3">
              {photoLoading ? <p role="status" className="text-xs text-muted-foreground">Loading request photos…</p> : null}
              {photoError ? <p role="alert" className="text-xs text-danger">{photoError}</p> : null}
              {loading ? <Spinner aria-label="Loading active requests" /> : error ? (
                <div className="space-y-3"><p role="alert" className="text-sm text-danger">{error}</p>{onRetry ? <Button variant="outline" size="sm" onPress={onRetry}>Retry requests</Button> : null}</div>
              ) : requests.length === 0 ? <p className="text-sm text-muted-foreground">No active maintenance requests.</p> : requests.map((request) => renderRequest(request, () => { if (!saving) setPendingId(request.id); }))}
              {requests.length >= MAINTENANCE_HISTORY_LIMIT ? <p className="text-xs text-muted-foreground">Showing up to {MAINTENANCE_HISTORY_LIMIT} active requests, prioritizing In Progress.</p> : null}
            </Modal.Body>
            {pending ? (
              <Modal.Footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p role="status" className="min-w-0 flex-1 basis-48 break-words text-sm text-foreground">Cancel “{pending.title}”? This cannot be undone.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" autoFocus isDisabled={saving} onPress={() => setPendingId(null)}>Keep request</Button>
                  <Button variant="danger" size="sm" isDisabled={saving} onPress={confirmCancel}>{saving ? "Cancelling..." : "Yes, cancel request"}</Button>
                </div>
              </Modal.Footer>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
