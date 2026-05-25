import { Modal, Button } from "@heroui/react";
import { CircleCheck } from "lucide-react";
import Link from "next/link";

interface SuccessModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  role: string;
}

export default function SuccessModal({
  isOpen,
  onOpenChange,
  role,
}: SuccessModalProps) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
        isDismissable={false}
        isKeyboardDismissDisabled
      >
        <Modal.Container placement="center">
          <Modal.Dialog>
            {/* No Modal.CloseTrigger = no close button, equivalent to hideCloseButton */}
            <Modal.Body className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-green-100 p-4">
                <CircleCheck size={48} className="text-green-600" />
              </div>
              <h2 className="font-noto-serif text-center text-2xl font-semibold">
                Account Created!
              </h2>
              <p className="max-w-xs text-center text-sm text-default-500">
                Your account has been created successfully. You can now sign in
                with your email and password.
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Link href={role === "tenant" ? "/tenant/my-rental" : "/landlord/dashboard"}>
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                >
                  Continue to {role === "tenant" ? "My Rental" : "Dashboard"}
                </Button>
              </Link>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}