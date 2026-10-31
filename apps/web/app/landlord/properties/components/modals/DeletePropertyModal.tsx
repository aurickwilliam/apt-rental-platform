import { Button, Modal } from "@heroui/react";
import ErrorBanner from "@/app/components/display/ErrorBanner";

type Props = {
  isOpen: boolean;
  propertyName?: string;
  isDeleting: boolean;
  /** The database's reason when the delete was refused, shown as-is. */
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeletePropertyModal({
  isOpen,
  propertyName,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => { if (!open) onClose(); }}
        isDismissable={!isDeleting}
        isKeyboardDismissDisabled={isDeleting}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger className="text-black" />

            <Modal.Header>
              <p className="text-base font-semibold">Delete Property</p>
            </Modal.Header>

            <Modal.Body>
              <p className="text-sm text-black">
                Are you sure you want to delete{" "}
                <span className="font-medium text-primary">{propertyName}</span>?
                This action cannot be undone.
              </p>
              {error ? <ErrorBanner message={error} /> : null}
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="ghost"
                onPress={onClose}
                isDisabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                isPending={isDeleting}
                onPress={onConfirm}
              >
                Delete
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}