"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Button, Modal } from "@heroui/react";
import { IconHomeFilled, IconPencil, IconStarFilled, IconX } from "@tabler/icons-react";

import { markReviewUnlockSeen, useReviewUnlock } from "@/hooks/use-review-unlock";

/**
 * Mounted once in the tenant layout: right after the tenant opens the
 * website, the first newly-reviewable stay pops a "You can now review"
 * modal. Dismiss-forever on either action (Write a Review or Maybe later).
 */
export default function ReviewUnlockGate() {
  const router = useRouter();
  const candidate = useReviewUnlock();
  const [dismissedTenancyId, setDismissedTenancyId] = useState<string | null>(null);

  const isOpen = candidate !== null && dismissedTenancyId !== candidate.tenancyId;

  if (!candidate) return null;

  const dismiss = () => {
    markReviewUnlockSeen(candidate.tenancyId);
    setDismissedTenancyId(candidate.tenancyId);
  };

  const handleReview = () => {
    dismiss();
    router.push(`/tenant/browse/${candidate.apartmentId}/ratings`);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => {
      if (!open) dismiss();
    }}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="center" scroll="inside" className="review-unlock-container">
          <Modal.Dialog className="review-unlock-modal">
            <Modal.Header className="review-unlock-header">
              <Modal.CloseTrigger
                aria-label="Close"
                className="review-unlock-close rounded-full border border-border bg-muted text-foreground hover:bg-muted"
              >
                <IconX size={18} strokeWidth={2.5} aria-hidden="true" />
              </Modal.CloseTrigger>
            </Modal.Header>
            <Modal.Body className="review-unlock-body">
              <div className="mx-auto w-full max-w-md">
                <div className="flex flex-col items-center gap-3 py-1 text-center">
                  <div aria-hidden="true" className="relative mx-auto flex size-28 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <IconHomeFilled size={52} className="text-primary" />
                    <IconStarFilled size={16} className="absolute -right-1 top-2 text-rating" />
                    <IconStarFilled size={12} className="absolute -left-1 top-6 text-rating" />
                    <IconStarFilled size={10} className="absolute -bottom-1 right-3 text-rating" />
                  </div>
                  <Modal.Heading className="review-unlock-heading">
                    You can now review {candidate.apartmentName}!
                  </Modal.Heading>
                  <span aria-hidden="true" className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconStarFilled key={star} size={32} className="text-rating" />
                    ))}
                  </span>
                  <p className="text-sm text-muted-foreground">
                    Thanks for staying with us — your experience can help other
                    tenants find their place to thrive.
                  </p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer className="review-unlock-footer">
              <Button className="review-unlock-action rounded-full" onPress={handleReview}>
                <IconPencil size={18} aria-hidden="true" />
                Write a Review
              </Button>
              <Button variant="outline" className="review-unlock-action rounded-full" onPress={dismiss}>
                Maybe later
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
