import { Modal, Button } from "@heroui/react";
import { CircleAlert } from "lucide-react";

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
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
      >
        <Modal.Container placement="center">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Something went wrong</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-danger-100 p-3">
                <CircleAlert size={32} className="text-danger" />
              </div>
              <p className="text-center text-sm text-default-500">{error}</p>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="danger-soft"
                size="lg"
                className="w-full"
                slot="close"
              >
                Close
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}