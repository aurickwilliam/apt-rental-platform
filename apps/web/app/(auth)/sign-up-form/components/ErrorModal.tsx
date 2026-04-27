import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { CircleAlert } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  error: string | null;
}

export default function ErrorModal({
  isOpen,
  onOpenChange,
  error,
}: ErrorModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Something went wrong
            </ModalHeader>
            <ModalBody className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-danger-100 p-3">
                <CircleAlert size={32} className="text-danger" />
              </div>
              <p className="text-center text-sm text-default-500">{error}</p>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="flat"
                radius="full"
                size="lg"
                className="w-full"
                onPress={onClose}
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}