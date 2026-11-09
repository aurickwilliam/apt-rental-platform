"use client";

import { Button, Modal } from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";

type VerifySubmitConfirmProps = {
  open: boolean;
  isSubmitting: boolean;
  idPhotosReady: boolean;
  selfieReady: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

// Final confirmation shared by the mobile-browser and desktop verification
// flows. Rendered only from a review screen whose captures already passed
// validation; the checklist mirrors those real states. Closing retains all
// wizard state — uploads only begin when onConfirm runs. Dismissal
// (backdrop, Escape, close trigger, back action) is blocked while a
// submission is in flight.
export default function VerifySubmitConfirm({
  open,
  isSubmitting,
  idPhotosReady,
  selfieReady,
  onConfirm,
  onClose,
}: VerifySubmitConfirmProps) {
  const handleOpenChange = (value: boolean) => {
    if (!value && isSubmitting) return;
    if (!value) onClose();
  };

  return (
    <Modal isOpen={open} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container placement="center" size="sm" scroll="inside">
          <Modal.Dialog
            aria-label="Submit for verification"
            className="w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-2xl sm:w-full"
          >
            <Modal.Body className="@container flex flex-col gap-4 p-2">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-nunito text-lg font-bold text-foreground">
                  Submit for verification?
                </h2>
                <p className="text-sm leading-5 text-muted-foreground">
                  Please review your ID photos and selfie before submitting.
                  Once submitted, your documents will be sent to our team for review.
                </p>
              </div>
              <ul className="flex list-none flex-col gap-2 p-0">
                <ChecklistItem ready={idPhotosReady} label="Your required ID photos are ready." />
                <ChecklistItem ready={selfieReady} label="Your selfie is ready." />
              </ul>
              {/* Container-based layout (not viewport-based): this capped
                dialog never fits both buttons side by side, so they stack
                at 87% width, centered, with no dead space on either side.
                If the dialog ever widens past their combined width, they
                share one row at intrinsic width. */}
              <div className="mt-1 flex flex-col-reverse items-center gap-2 @[360px]:flex-row @[360px]:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onPress={onClose}
                  isDisabled={isSubmitting}
                  className="w-[95%] border border-primary/25 bg-primary/10 px-6 text-sm font-semibold text-primary hover:bg-primary/15 @[360px]:w-auto"
                >
                  Go back and review
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    if (!isSubmitting && idPhotosReady && selfieReady) onConfirm();
                  }}
                  isDisabled={isSubmitting || !idPhotosReady || !selfieReady}
                  isPending={isSubmitting}
                  className="w-[95%] px-6 text-sm font-semibold @[360px]:w-auto"
                >
                  Confirm &amp; submit
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function ChecklistItem({ ready, label }: { ready: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      {ready ? (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
          <IconCheck size={14} aria-hidden="true" />
        </span>
      ) : (
        <span
          className="size-5 shrink-0 rounded-full border border-border"
          aria-hidden="true"
        />
      )}
      <span className="text-sm text-muted-foreground">{label}</span>
    </li>
  );
}
