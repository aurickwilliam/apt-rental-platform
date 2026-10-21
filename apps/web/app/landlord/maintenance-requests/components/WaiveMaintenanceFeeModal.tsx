"use client";

import { Button, Modal } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";

type WaiveMaintenanceFeeModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  feeAmount: number;
  onConfirm: () => void;
  isSubmitting?: boolean;
};

export default function WaiveMaintenanceFeeModal({
  isOpen,
  onOpenChange,
  tenantName,
  feeAmount,
  onConfirm,
  isSubmitting = false,
}: WaiveMaintenanceFeeModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && isSubmitting) return;
        onOpenChange(open);
      }}
    >
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Waive maintenance fee</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3">
              <p className="text-center text-3xl font-nunito font-bold text-primary">
                {formatPesoDisplay(feeAmount)}
              </p>
              <p className="text-sm font-nunito text-muted-foreground">
                {tenantName} will no longer be charged this fee, and it will be removed
                from their next rent.
              </p>
              <p className="text-sm font-nunito font-semibold text-primary">
                This write-off cannot be undone.
              </p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button
                variant="danger-soft"
                size="sm"
                onPress={() => onOpenChange(false)}
                isDisabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onPress={onConfirm}
                isDisabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Waiving..." : "Waive fee"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
