"use client";

import { useMemo, useState } from "react";
import { Button, Modal, Spinner, TextArea, toast } from "@heroui/react";
import { IconClockHour4, IconEyeOff, IconX } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/browser";
import {
  LISTING_REVIEW_NOTE_MAX_LENGTH,
  getErrorMessage,
  getListingReviewBanner,
  validateListingReviewNote,
} from "@repo/utils";

import { useListingReview } from "@/hooks/use-listing-review";
import { requestListingReview } from "@/service/listingReviewService";

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

const formatDate = (value: string | null) => (value ? dateFormatter.format(new Date(value)) : null);

/**
 * Shown on a listing an admin hid: why, and a way to say it was fixed. Renders
 * nothing for a visible listing, so it is safe to place on every property page.
 */
export default function HiddenListingBanner({ apartmentId }: { apartmentId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const { state, refresh } = useListingReview(apartmentId);
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const banner = getListingReviewBanner(state);
  if (banner === "none") return null;

  const close = () => {
    if (isSending) return;
    setIsOpen(false);
    setNote("");
    setError(null);
  };

  const send = async () => {
    const problem = validateListingReviewNote(note);
    if (problem) {
      setError(problem);
      return;
    }
    setIsSending(true);
    setError(null);
    try {
      await requestListingReview(supabase, apartmentId, note);
      toast.success("Review requested. Our team will answer soon.");
      setIsOpen(false);
      setNote("");
      refresh();
    } catch (requestError) {
      console.error("[listing-review] Failed to send request:", requestError);
      setError(getErrorMessage(requestError, "Something went wrong. Try again."));
    } finally {
      setIsSending(false);
    }
  };

  const request = state.request;
  const isPending = banner === "pending";

  return (
    <>
      <section
        aria-label="Listing hidden"
        className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:justify-between ${
          isPending ? "border-amber-300 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/40" : "border-danger/40 bg-danger/5"
        }`}
      >
        <div className="flex min-w-0 gap-3">
          {isPending ? (
            <IconClockHour4 size={22} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          ) : (
            <IconEyeOff size={22} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
          )}
          <div className="min-w-0 space-y-1 text-sm">
            <p className="font-nunito text-base font-bold text-foreground">
              {isPending ? "Review requested" : "This listing is hidden from search"}
            </p>
            {isPending ? (
              <>
                <p className="text-muted-foreground">
                  You asked for a review{formatDate(request?.createdAt ?? null) ? ` on ${formatDate(request?.createdAt ?? null)}` : ""}.
                  Our team will answer soon, and you will be notified.
                </p>
                {request?.note ? <p className="wrap-break-word text-foreground">Your note: {request.note}</p> : null}
              </>
            ) : (
              <>
                {state.reason ? <p className="wrap-break-word text-foreground">Reason: {state.reason}</p> : null}
                {banner === "declined" ? (
                  <p className="wrap-break-word text-foreground">
                    Your last request was declined{request?.decisionNote ? `: ${request.decisionNote}` : "."}
                  </p>
                ) : null}
                <p className="text-muted-foreground">
                  Tenants with a tenancy here can still see it. Fix the issue, then ask our team to review it.
                </p>
              </>
            )}
          </div>
        </div>
        {!isPending ? (
          <Button className="shrink-0 cursor-pointer rounded-full" onPress={() => setIsOpen(true)}>
            {banner === "declined" ? "Request another review" : "Request review"}
          </Button>
        ) : null}
      </section>

      <Modal isOpen={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : close())}>
        <Modal.Backdrop isDismissable={!isSending} isKeyboardDismissDisabled={isSending}>
          <Modal.Container size="md" placement="center">
            <Modal.Dialog className="rounded-2xl">
              <Modal.CloseTrigger className="maintenance-modal-close" aria-label="Close" isDisabled={isSending}>
                <IconX size={16} aria-hidden="true" />
              </Modal.CloseTrigger>
              <Modal.Header className="pr-12">
                <Modal.Heading className="font-nunito text-lg font-bold text-primary">Request a review</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Tell our team what you fixed. They will review the listing and restore it or tell you what still needs work.
                </p>
                <TextArea
                  aria-label="What did you fix?"
                  placeholder="For example: I corrected the price and replaced the photos"
                  value={note}
                  maxLength={LISTING_REVIEW_NOTE_MAX_LENGTH}
                  onChange={(event) => setNote(event.target.value)}
                  disabled={isSending}
                  rows={4}
                  fullWidth
                />
                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer rounded-full" onPress={close} isDisabled={isSending}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 cursor-pointer rounded-full"
                  onPress={() => void send()}
                  isDisabled={isSending || validateListingReviewNote(note) !== null}
                >
                  {isSending ? (
                    <>
                      <Spinner size="sm" color="current" aria-hidden="true" />
                      Sending...
                    </>
                  ) : (
                    "Send request"
                  )}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
