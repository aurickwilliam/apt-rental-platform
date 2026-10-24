import { Modal, Button } from "@heroui/react";
import { IconCircleCheck as CircleCheck } from "@tabler/icons-react";
import Link from "next/link";

interface SuccessModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  role: string;
}

// Fresh tenants continue to rental personalization (the same page the
// Google/complete-profile path uses); the page itself offers a skip and
// never shows again once preferences are saved.
const TENANT_NEXT_HREF = "/tenant/personalize?fresh=1";
const LANDLORD_NEXT_HREF = "/landlord/dashboard";

export default function SuccessModal({
  isOpen,
  onOpenChange,
  role,
}: SuccessModalProps) {
  const isTenant = role === "tenant";

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
              <h2 className="font-nunitoSemiBold text-foreground text-center text-2xl font-semibold">
                Account Created!
              </h2>
              <p className="max-w-xs text-center text-sm text-foreground">
                {isTenant
                  ? "Your account has been created. Tell us what you're looking for and we'll tailor your apartment search."
                  : "Your account has been created successfully. You can now manage your properties from your dashboard."}
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Link className="w-full" href={isTenant ? TENANT_NEXT_HREF : LANDLORD_NEXT_HREF}>
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                >
                  {isTenant ? "Personalize my experience" : "Continue to Dashboard"}
                </Button>
              </Link>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}