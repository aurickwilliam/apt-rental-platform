"use client";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";
import { PENDING_PAYMENT } from "../constants";
import { peso } from "../utils";

type PaymentModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function PaymentModal({ isOpen, onOpenChange, onConfirm }: PaymentModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="md">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-base">Confirm payment</ModalHeader>

            <ModalBody>
              <div className="space-y-2">
                {PENDING_PAYMENT.breakdown.map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{item.label}</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{peso(item.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex justify-between text-sm font-medium">
                <span>Total</span>
                <span>{peso(PENDING_PAYMENT.total)}</span>
              </div>

              <p className="text-xs text-zinc-500">
                Payment for {PENDING_PAYMENT.month} · Due {PENDING_PAYMENT.dueDate}
              </p>
            </ModalBody>

            <ModalFooter>
              <Button variant="bordered" onPress={onClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
              >
                Confirm & pay {peso(PENDING_PAYMENT.total)}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
