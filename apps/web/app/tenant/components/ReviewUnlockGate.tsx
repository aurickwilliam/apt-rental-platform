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
      <Modal.Backdrop>
        <Modal.Container scroll="inside" className="w-full max-w-3xl">
          <Modal.Dialog className="w-full max-w-3xl">
            <Modal.Header>
              <div className="flex w-full justify-end">
                <Modal.CloseTrigger
                  aria-label="Close"
                  className="rounded-full border border-border bg-muted p-1.5 text-foreground hover:bg-muted"
                >
                  <IconX size={18} strokeWidth={2.5} />
                </Modal.CloseTrigger>
              </div>
            </Modal.Header>
            <Modal.Body>
              <div className="mx-auto w-full max-w-md">
              <div className="flex flex-col items-center gap-3 py-1 text-center">
                <div className="relative mx-auto flex size-28 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <IconHomeFilled size={52} className="text-primary" />
                  <IconStarFilled size={16} className="absolute -right-1 top-2 text-rating" />
                  <IconStarFilled size={12} className="absolute -left-1 top-6 text-rating" />
                  <IconStarFilled size={10} className="absolute -bottom-1 right-3 text-rating" />
                </div>
                <h2 className="font-nunito text-3xl font-bold leading-tight text-balance text-card-foreground sm:text-4xl">
                  You can now review {candidate.apartmentName}!
                </h2>
                <span className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <IconStarFilled key={star} size={32} className="text-rating" />
                  ))}
                </span>
                <p className="text-sm text-muted-foreground">
                  Thanks for staying with us — your experience can help other
                  tenants find their place to thrive.
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1 rounded-full" onPress={handleReview}>
                  <IconPencil size={18} />
                  Write a Review
                </Button>
                <Button variant="outline" className="flex-1 rounded-full" onPress={dismiss}>
                  Maybe later
                </Button>
              </div>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
