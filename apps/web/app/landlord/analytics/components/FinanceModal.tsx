"use client";

import type { ReactNode } from "react";
import { Modal } from "@heroui/react";

interface FinanceModalProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
}

/** Mounted only for an active web dialog; HeroUI owns focus trapping/restoration. */
export default function FinanceModal({
  title,
  description,
  children,
  footer,
  onClose,
  busy = false,
  wide = false,
}: FinanceModalProps) {
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Modal.Backdrop isDismissable={!busy} isKeyboardDismissDisabled={busy}>
        <Modal.Container placement="center" size="lg" scroll="inside">
          <Modal.Dialog
            className={`finance-modal w-full ${wide ? "max-w-4xl!" : "max-w-xl!"}`}
          >
            <Modal.CloseTrigger
              aria-label={`Close ${title.toLowerCase()}`}
              isDisabled={busy}
            />
            <Modal.Header>
              <Modal.Heading className="font-nunito text-xl font-bold">
                {title}
              </Modal.Heading>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </Modal.Header>
            <Modal.Body className="space-y-4">{children}</Modal.Body>
            <Modal.Footer className="flex-col items-stretch gap-3 border-t border-border">
              {footer}
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
