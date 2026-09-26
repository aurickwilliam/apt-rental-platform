"use client";

import { useState, useTransition } from "react";
import { Button, Label, ListBox, Modal, Select, TextArea } from "@heroui/react";
import type { ReviewResult } from "../actions/verification";

type ReviewKind = "user" | "apartment";

interface ReviewFormProps {
  verificationId: string;
  kind?: ReviewKind;
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
      {error ? (
        <p role="alert" aria-live="polite" className="mb-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          onPress={() => setDecision("approved")}
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="danger-soft"
          onPress={() => setDecision("rejected")}
        >
          Reject
        </Button>
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
                <Modal.Heading>
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
                        <Label>Rejection reason</Label>
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
                      <TextArea
                        name="reason"
                        aria-label="Additional rejection details"
                        placeholder="Add details for the applicant…"
                      />
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
                <Modal.Footer className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="tertiary"
                    isDisabled={isPending}
                    onPress={closeDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant={isRejecting ? "danger" : "primary"}
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
