"use client";

import { useState, useTransition } from "react";
import { Button, Label, ListBox, Modal, Select, TextArea } from "@heroui/react";
import { IconCheck, IconX } from "@tabler/icons-react";
import type { ReviewResult } from "../actions/verification";

type ReviewKind = "user" | "apartment";

interface ReviewFormProps {
  verificationId: string;
  kind?: ReviewKind;
  sticky?: boolean;
  onReview: (formData: FormData) => Promise<ReviewResult>;
}

const REJECTION_REASONS: Record<ReviewKind, string[]> = {
  user: [
    "Unclear ID",
    "Inconsistent information",
    "Selfie mismatch",
    "Unsupported document",
    "Incomplete",
    "Other",
  ],
  apartment: [
    "Incomplete information",
    "Needs clarification",
    "Duplicate listing",
    "Insufficient images",
    "Location unclear",
    "Other",
  ],
};

export function ReviewForm({
  verificationId,
  kind = "user",
  sticky = false,
  onReview,
}: ReviewFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );

  function closeDialog() {
    if (!isPending) setDecision(null);
  }

  function submit(status: "approved" | "rejected", formData: FormData) {
    setError(null);
    if (status === "rejected") {
      const category = formData.get("reasonCategory");
      const detailValue = formData.get("reason");
      const detail = typeof detailValue === "string" ? detailValue.trim() : "";
      if (typeof category !== "string" || !category) {
        setError("Select a rejection reason.");
        return;
      }
      formData.set("reason", detail ? `${category}: ${detail}` : category);
    }
    formData.set("id", verificationId);
    formData.set("status", status);
    startTransition(async () => {
      const result = await onReview(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setDecision(null);
    });
  }

  const isRejecting = decision === "rejected";
  return (
    <>
      <div
        className={
          sticky
            ? "pointer-events-none fixed right-4 bottom-20 left-4 z-30 md:right-6 md:bottom-6 md:left-70"
            : ""
        }
      >
        <div
          className={
            sticky
              ? "pointer-events-auto mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 shadow-lg sm:p-5"
              : ""
          }
        >
          {sticky ? (
            <p className="font-nunito text-sm font-bold sm:text-base">
              Do you want to approve this user?
            </p>
          ) : null}
          {error ? (
            <p
              role="alert"
              aria-live="polite"
              className={`${sticky ? "" : "mb-3"} text-sm text-danger`}
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={sticky ? "danger-soft" : "primary"}
              onPress={() => setDecision(sticky ? "rejected" : "approved")}
            >
              {sticky ? (
                <IconX size={18} aria-hidden="true" />
              ) : (
                <IconCheck size={18} aria-hidden="true" />
              )}
              {sticky ? "Reject" : "Approve"}
            </Button>
            <Button
              type="button"
              variant={sticky ? "primary" : "danger-soft"}
              onPress={() => setDecision(sticky ? "approved" : "rejected")}
            >
              {sticky ? (
                <IconCheck size={18} aria-hidden="true" />
              ) : (
                <IconX size={18} aria-hidden="true" />
              )}
              {sticky ? "Approve" : "Reject"}
            </Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={decision !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading
                  className={`flex items-center gap-2 font-nunito font-bold text-lg ${isRejecting ? "text-danger" : "text-primary"}`}
                >
                  {isRejecting ? (
                    <IconX size={22} aria-hidden="true" />
                  ) : (
                    <IconCheck size={22} aria-hidden="true" />
                  )}
                  {isRejecting ? "Reject verification" : "Approve verification"}
                </Modal.Heading>
              </Modal.Header>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submit(
                    decision ?? "rejected",
                    new FormData(event.currentTarget),
                  );
                }}
              >
                <Modal.Body className="space-y-4">
                  {isRejecting ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Explain what the applicant or landlord needs to correct
                        before resubmitting.
                      </p>
                      <Select
                        name="reasonCategory"
                        placeholder="Select a reason"
                        isRequired
                      >
                        <Label>Rejection reason:</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {REJECTION_REASONS[kind].map((reason) => (
                              <ListBox.Item
                                key={reason}
                                id={reason}
                                textValue={reason}
                              >
                                {reason}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <div className="w-full space-y-2">
                        <Label htmlFor="verification-rejection-details">
                          Additional details:
                        </Label>
                        <TextArea
                          id="verification-rejection-details"
                          name="reason"
                          className="w-full h-30"
                          placeholder="Add details for the applicant…"
                        />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This marks the verification as approved and updates its
                      verified status. Continue?
                    </p>
                  )}
                  {error ? (
                    <p role="alert" className="text-sm text-danger">
                      {error}
                    </p>
                  ) : null}
                </Modal.Body>
                <Modal.Footer className="flex w-full gap-2">
                  <Button
                    type="button"
                    variant="tertiary"
                    className="min-w-0 flex-1"
                    isDisabled={isPending}
                    onPress={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant={isRejecting ? "danger" : "primary"}
                    className="min-w-0 flex-1"
                    isPending={isPending}
                  >
                    {isRejecting ? "Confirm rejection" : "Confirm approval"}
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
