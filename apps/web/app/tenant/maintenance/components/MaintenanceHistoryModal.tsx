"use client";

import type { ReactNode } from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { IconX } from "@tabler/icons-react";
import { MAINTENANCE_HISTORY_LIMIT, type MaintenanceRequest } from "@/service/maintenanceService";

interface MaintenanceHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;
  photoLoading: boolean;
  photoError: string | null;
  limitReached: boolean;
  onRetry?: () => void;
  renderRequest: (request: MaintenanceRequest) => ReactNode;
}

export default function MaintenanceHistoryModal({ isOpen, onOpenChange, requests, loading, error, photoLoading, photoError, limitReached, onRetry, renderRequest }: MaintenanceHistoryModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container size="lg" scroll="inside" placement="center">
          <Modal.Dialog className="w-full max-w-5xl!">
            <Modal.CloseTrigger className="maintenance-modal-close" aria-label="Close maintenance history"><IconX size={16} aria-hidden="true" /></Modal.CloseTrigger>
            <Modal.Header className="pr-12">
              <Modal.Heading className="font-nunito text-xl font-bold text-foreground">More maintenance history</Modal.Heading>
              <p className="mt-1 text-sm text-muted-foreground">Older resolved and cancelled requests, newest first.</p>
            </Modal.Header>
            <Modal.Body className="space-y-2">
              {photoLoading ? <p role="status" className="text-xs text-muted-foreground">Loading request photos…</p> : null}
              {photoError ? <p role="alert" className="text-xs text-danger">{photoError}</p> : null}
              {loading ? <Spinner aria-label="Loading maintenance history" /> : error ? <div className="space-y-3"><p role="alert" className="text-sm text-danger">{error}</p>{onRetry ? <Button variant="outline" size="sm" onPress={onRetry}>Retry history</Button> : null}</div>
                : requests.length ? requests.map(renderRequest) : <p className="text-sm text-muted-foreground">No more maintenance requests.</p>}
              {limitReached ? <p className="pt-2 text-xs text-muted-foreground">History is limited to the latest {MAINTENANCE_HISTORY_LIMIT} requests.</p> : null}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
