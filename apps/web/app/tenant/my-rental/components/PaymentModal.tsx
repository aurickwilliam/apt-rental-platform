"use client";

import { Button, Modal, useOverlayState } from "@heroui/react";
import { PENDING_PAYMENT } from "../constants";
import { peso } from "../utils";

type PaymentModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export default function PaymentModal({ isOpen, onOpenChange, onConfirm }: PaymentModalProps) {
  const state = useOverlayState({ isOpen, onOpenChange });

  return (
    <Modal>
      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <Modal.Container>
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header className="text-base">
                  Confirm payment
                </Modal.Header>

                <Modal.Body>
                  <div className="space-y-2">
                    {PENDING_PAYMENT.breakdown.map((item) => (
                      <div key={item.label} className="flex justify-between text-sm">
                        <span className="text-zinc-500">{item.label}</span>
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {peso(item.amount)}
                        </span>
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
                </Modal.Body>

                <Modal.Footer>
                  <Button variant="secondary" onPress={close}>
                    Cancel
                  </Button>

                  <Button
                    onPress={() => {
                      onConfirm();
                      close();
                    }}
                  >
                    Confirm & pay {peso(PENDING_PAYMENT.total)}
                  </Button>
                </Modal.Footer>

                <Modal.CloseTrigger />
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
