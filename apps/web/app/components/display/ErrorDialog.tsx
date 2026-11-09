"use client";

import { Button, Modal } from "@heroui/react";
import { IconAlertCircle } from "@tabler/icons-react";

interface ErrorDialogProps {
  message: string | null;
  onClose: () => void;
  title?: string;
}

/**
 * Shared crucial-error dialog (mobile `components/display/ErrorDialog.tsx`
 * parity, Web). Used only for errors that must not be missed — a failed
 * payment, a failed submission. Field-level and secondary errors stay as
 * inline `ErrorBanner` / `FieldError` next to the control.
 */
export default function ErrorDialog({
  message,
  onClose,
  title = "Something went wrong",
}: ErrorDialogProps) {
  return (
    <Modal
      isOpen={message !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-2xl">
            <Modal.CloseTrigger
              aria-label="Dismiss error"
              className="top-4 right-4 z-10 size-8 rounded-full bg-muted text-foreground hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-primary"
            />
            <Modal.Header className="pr-12">
              <Modal.Heading className="flex items-center gap-2 font-nunito text-lg font-bold text-danger">
                <IconAlertCircle
                  size={20}
                  className="shrink-0"
                  aria-hidden="true"
                />
                {title}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted-foreground">{message ?? ""}</p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onPress={onClose}
                className="rounded-full"
              >
                Dismiss
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
