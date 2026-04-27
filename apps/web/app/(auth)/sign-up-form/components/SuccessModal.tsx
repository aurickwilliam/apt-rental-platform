import {
  Modal,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { CircleCheck } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  role: string;
}

export default function SuccessModal({
  isOpen,
  onOpenChange,
  role,
}: SuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled
      hideCloseButton
    >
      <ModalContent>
        {() => (
          <>
            <ModalBody className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-green-100 p-4">
                <CircleCheck size={48} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold font-noto-serif text-center">
                Account Created!
              </h2>
              <p className="text-default-500 text-center text-sm max-w-xs">
                Your account has been created successfully. You can now sign in
                with your email and password.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                color="primary"
                radius="full"
                size="lg"
                className="w-full"
                as="a"
                href={role === "tenant" ? "/tenant/my-rental" : "/landlord/dashboard"}
              >
                Continue to {role === "tenant" ? "My Rental" : "Dashboard"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}