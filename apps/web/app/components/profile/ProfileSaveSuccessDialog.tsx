"use client";

import { Button, Modal } from "@heroui/react";
import { IconCircleCheck } from "@tabler/icons-react";

interface ProfileSaveSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionLabel?: string;
}

export default function ProfileSaveSuccessDialog({
  isOpen,
  onClose,
  title = "Profile updated",
  message = "Your profile changes have been saved.",
  actionLabel = "Back to profile",
}: ProfileSaveSuccessDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-2xl">
            <Modal.CloseTrigger
              aria-label="Back to profile"
              className="top-4 right-4 z-10 size-8 rounded-full bg-muted text-foreground hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-primary"
            />
            <Modal.Header className="pr-12">
              <Modal.Heading className="flex items-center gap-2 font-nunito text-lg font-bold text-success">
                <IconCircleCheck
                  size={20}
                  className="shrink-0"
                  aria-hidden="true"
                />
                {title}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted-foreground">{message}</p>
            </Modal.Body>
            <Modal.Footer className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onPress={onClose}
                className="rounded-full"
              >
                {actionLabel}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
