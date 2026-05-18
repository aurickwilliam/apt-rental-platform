import { Button, Modal } from "@heroui/react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  description?: string | null;
};

export default function DescriptionModal({ isOpen, onClose, description }: Props) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>Description</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p className="text-sm text-default-700 whitespace-pre-line">
                    {description ?? "—"}
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="tertiary" onPress={close}>Close</Button>
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