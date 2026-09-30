"use client";

import { Button, Modal, Spinner } from "@heroui/react";
import { Trash2 } from "lucide-react";

type RemovePhotoConfirmModalProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isRemoving: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

// Shared confirm dialog for avatar / cover removal. Removal only runs on
// confirm; the hook keeps the displayed image on failure.
export default function RemovePhotoConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Remove",
  isRemoving,
  onClose,
  onConfirm,
}: RemovePhotoConfirmModalProps) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        isDismissable={!isRemoving}
        isKeyboardDismissDisabled={isRemoving}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-2xl">
            <Modal.CloseTrigger
              aria-label="Close remove confirmation"
              className="top-4 right-4 z-10 size-8 rounded-full bg-muted text-foreground hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-primary"
            />
            <Modal.Header className="pr-12">
              <Modal.Heading className="flex items-center gap-2 text-base font-semibold text-danger">
                <Trash2 size={18} className="shrink-0" aria-hidden="true" />
                {title}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted-foreground">{description}</p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onPress={onClose}
                isDisabled={isRemoving}
                className="rounded-full"
              >
                Keep
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onPress={onConfirm}
                isDisabled={isRemoving}
                className="rounded-full"
              >
                {isRemoving ? (
                  <>
                    <Spinner size="sm" color="current" aria-hidden="true" />
                    Removing...
                  </>
                ) : (
                  confirmLabel
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
