"use client";

import { Modal, Button } from "@heroui/react";
import { IconAlertCircle as CircleAlert } from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface ErrorModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  error: string | null;
}

export default function ErrorModal({
  isOpen,
  onOpenChange,
  error,
}: ErrorModalProps) {
  const { t } = useTranslation();

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
      >
        <Modal.Container placement="center">
          <Modal.Dialog>
            <Modal.CloseTrigger className="text-foreground" />
            <Modal.Header>
              <Modal.Heading>
                {t("auth.errorModal.title")}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-danger-100 p-3">
                <CircleAlert size={45} className="text-danger" />
              </div>
              <p className="text-center text-sm text-foreground">
                {error}
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="danger-soft"
                size="lg"
                className="w-full"
                slot="close"
              >
                {t("common.close")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}