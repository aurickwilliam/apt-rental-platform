"use client";

import type { ReactNode } from "react";
import { Button, Drawer, Spinner, useOverlayState } from "@heroui/react";
import { IconHistory, IconX } from "@tabler/icons-react";
import { MAINTENANCE_HISTORY_LIMIT, type MaintenanceRequest } from "@/service/maintenanceService";
import { emptyHistoryFilters, historyFilterCount, type MaintenanceHistoryFilters as HistoryFilters } from "@repo/utils/maintenance-history";
import EmptyState from "@/app/components/display/EmptyState";
import MaintenanceHistoryFilters from "./MaintenanceHistoryFilters";

interface MaintenanceHistoryModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requests: MaintenanceRequest[];
  filters: HistoryFilters;
  onApplyFilters: (filters: HistoryFilters) => void;
  loading: boolean;
  error: string | null;
  photoLoading: boolean;
  photoError: string | null;
  limitReached: boolean;
  onRetry?: () => void;
  renderRequest: (request: MaintenanceRequest) => ReactNode;
}

export default function MaintenanceHistoryModal({ isOpen, onOpenChange, requests, filters, onApplyFilters, loading, error, photoLoading, photoError, limitReached, onRetry, renderRequest }: MaintenanceHistoryModalProps) {
  const activeFilterCount = historyFilterCount(filters);
  const drawerState = useOverlayState({
    isOpen,
    onOpenChange,
  });
  return (
    <Drawer.Root state={drawerState}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog
            aria-label="More maintenance history"
            className="maintenance-history-drawer flex h-full w-[calc(100vw-1rem)] max-w-md flex-col p-0"
          >
            <Drawer.CloseTrigger aria-label="Close maintenance history">
              <IconX size={16} aria-hidden="true" />
            </Drawer.CloseTrigger>
            <Drawer.Header className="pr-12">
              <div className="flex w-full flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Drawer.Heading className="font-nunito text-xl font-bold text-foreground">More maintenance history</Drawer.Heading>
                  <p className="mt-1 text-sm text-muted-foreground">All resolved and cancelled requests, newest first.</p>
                </div>
                <div className="ml-auto shrink-0">
                  <MaintenanceHistoryFilters filters={filters} onApply={onApplyFilters} disabled={loading || !!error} />
                </div>
              </div>
            </Drawer.Header>
            <Drawer.Body className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
              {activeFilterCount > 0 && !loading && !error ? <p role="status" className="text-sm text-muted-foreground">{requests.length} {requests.length === 1 ? "request matches" : "requests match"} your filters.</p> : null}
              {photoLoading ? <p role="status" className="text-xs text-muted-foreground">Loading request photos…</p> : null}
              {photoError ? <p role="alert" className="text-xs text-danger">{photoError}</p> : null}
              {loading ? <Spinner aria-label="Loading maintenance history" /> : error ? <div className="space-y-3"><p role="alert" className="text-sm text-danger">{error}</p>{onRetry ? <Button variant="outline" size="sm" onPress={onRetry}>Retry history</Button> : null}</div>
                : requests.length ? requests.map(renderRequest) : <EmptyState icon={IconHistory} className="py-4" title={activeFilterCount ? "No requests match your filters" : "No resolved or cancelled requests yet."}
                  description={activeFilterCount ? "Try different filters or clear them to see your history." : "Your completed and cancelled requests will appear here."}
                  action={activeFilterCount ? <Button variant="secondary" size="sm" onPress={() => onApplyFilters(emptyHistoryFilters())}>Clear filters</Button> : undefined} />}
              {limitReached ? <p className="pt-2 text-xs text-muted-foreground">History is limited to the latest {MAINTENANCE_HISTORY_LIMIT} requests. Filters apply to these loaded requests.</p> : null}
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  );
}
