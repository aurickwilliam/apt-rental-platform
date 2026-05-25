import { Button, Modal } from "@heroui/react";

type Props = {
  isOpen: boolean;
  propertyName?: string;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeletePropertyModal({
  isOpen,
  propertyName,
  isDeleting,
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