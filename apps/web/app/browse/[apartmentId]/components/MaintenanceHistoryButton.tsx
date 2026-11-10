"use client";

import { useState } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { IconTools } from "@tabler/icons-react";

import ApartmentMaintenanceHistory from "./ApartmentMaintenanceHistory";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import {
  APARTMENT_MAINTENANCE_HISTORY_LIST_LIMIT,
  fetchApartmentMaintenanceHistory,
  type ApartmentMaintenanceHistoryItem,
} from "@/service/apartmentMaintenanceHistoryService";

interface MaintenanceHistoryButtonProps {
  apartmentId: string;
}

export default function MaintenanceHistoryButton({ apartmentId }: MaintenanceHistoryButtonProps) {
  const { t } = useTranslation();
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
          err instanceof Error ? err.message : t("apartment.maintenance.loadError"),
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
        aria-label={t("apartment.maintenance.buttonAria")}
        onPress={handleOpen}
      >
        <IconTools size={16} />
        {t("apartment.maintenance.button")}
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
                  {t("common.close")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
