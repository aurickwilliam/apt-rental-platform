"use client";

import { useState } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { Wrench } from "lucide-react";

import ApartmentMaintenanceHistory from "./ApartmentMaintenanceHistory";
import {
  APARTMENT_MAINTENANCE_HISTORY_PAGE_SIZE,
  APARTMENT_MAINTENANCE_HISTORY_PREVIEW_LIMIT,
  fetchApartmentMaintenanceHistory,
  type ApartmentMaintenanceHistoryItem,
} from "@/service/apartmentMaintenanceHistoryService";

interface MaintenanceHistoryButtonProps {
  apartmentId: string;
}

export default function MaintenanceHistoryButton({ apartmentId }: MaintenanceHistoryButtonProps) {
  const historyModal = useOverlayState();
  const [mode, setMode] = useState<"preview" | "all">("preview");

  const [previewItems, setPreviewItems] = useState<ApartmentMaintenanceHistoryItem[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageItems, setPageItems] = useState<ApartmentMaintenanceHistoryItem[]>([]);
  const [pageTotal, setPageTotal] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadPreview = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await fetchApartmentMaintenanceHistory(
        apartmentId,
        APARTMENT_MAINTENANCE_HISTORY_PREVIEW_LIMIT,
        0,
      );
      setPreviewItems(result.items);
      setPreviewTotal(result.total);
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "Failed to load maintenance history.",
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadPage = async (nextPage: number) => {
    setPage(nextPage);
    setPageLoading(true);
    setPageError(null);
    try {
      const result = await fetchApartmentMaintenanceHistory(
        apartmentId,
        APARTMENT_MAINTENANCE_HISTORY_PAGE_SIZE,
        (nextPage - 1) * APARTMENT_MAINTENANCE_HISTORY_PAGE_SIZE,
      );
      setPageItems(result.items);
      setPageTotal(result.total);
    } catch (err) {
      setPageError(
        err instanceof Error ? err.message : "Failed to load maintenance history.",
      );
    } finally {
      setPageLoading(false);
    }
  };

  const handleOpen = () => {
    setMode("preview");
    historyModal.setOpen(true);
    void loadPreview();
  };

  const handleViewAll = () => {
    setMode("all");
    void loadPage(1);
  };

  const handleBack = () => {
    setMode("preview");
  };

  const handleClose = () => {
    historyModal.setOpen(false);
    setMode("preview");
  };

  return (
    <>
      <Button
        variant="outline"
        fullWidth
        aria-label="View maintenance history"
        onPress={handleOpen}
      >
        <Wrench size={16} />
        Maintenance History
      </Button>

      <Modal isOpen={historyModal.isOpen} onOpenChange={historyModal.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog>
              <Modal.CloseTrigger className="text-black" />
              <Modal.Body>
                {mode === "preview" ? (
                  <ApartmentMaintenanceHistory
                    items={previewItems}
                    total={previewTotal}
                    loading={previewLoading}
                    error={previewError}
                    page={1}
                    pageSize={APARTMENT_MAINTENANCE_HISTORY_PREVIEW_LIMIT}
                    showPagination={false}
                    onPageChange={() => undefined}
                  />
                ) : (
                  <ApartmentMaintenanceHistory
                    items={pageItems}
                    total={pageTotal}
                    loading={pageLoading}
                    error={pageError}
                    page={page}
                    pageSize={APARTMENT_MAINTENANCE_HISTORY_PAGE_SIZE}
                    showPagination
                    onPageChange={(next) => {
                      void loadPage(next);
                    }}
                  />
                )}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                {mode === "all" ? (
                  <Button variant="tertiary" onPress={handleBack}>
                    Back
                  </Button>
                ) : null}
                <Button
                  variant="tertiary"
                  className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
                  onPress={handleClose}
                >
                  Close
                </Button>
                {mode === "preview" &&
                !previewLoading &&
                !previewError &&
                previewTotal > APARTMENT_MAINTENANCE_HISTORY_PREVIEW_LIMIT ? (
                  <Button onPress={handleViewAll}>View all</Button>
                ) : null}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
