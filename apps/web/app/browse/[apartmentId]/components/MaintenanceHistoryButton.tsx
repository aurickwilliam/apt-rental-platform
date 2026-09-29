"use client";

import { useState } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { Wrench } from "lucide-react";

import ApartmentMaintenanceHistory from "./ApartmentMaintenanceHistory";
import {
  APARTMENT_MAINTENANCE_HISTORY_LIST_LIMIT,
  fetchApartmentMaintenanceHistory,
  type ApartmentMaintenanceHistoryItem,
} from "@/service/apartmentMaintenanceHistoryService";

interface MaintenanceHistoryButtonProps {
  apartmentId: string;
}

export default function MaintenanceHistoryButton({ apartmentId }: MaintenanceHistoryButtonProps) {
  const historyModal = useOverlayState();

  const [items, setItems] = useState<ApartmentMaintenanceHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = () => {
    historyModal.setOpen(true);
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchApartmentMaintenanceHistory(
          apartmentId,
          APARTMENT_MAINTENANCE_HISTORY_LIST_LIMIT,
          0,
        );
        setItems(result.items);
        setTotal(result.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load maintenance history.",
        );
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleClose = () => {
    historyModal.setOpen(false);
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
                <ApartmentMaintenanceHistory
                  items={items}
                  total={total}
                  loading={loading}
                  error={error}
                />
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  variant="tertiary"
                  className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
                  onPress={handleClose}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
