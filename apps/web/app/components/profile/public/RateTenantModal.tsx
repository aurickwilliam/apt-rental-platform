"use client";

import { useState } from "react";

import { Button, FieldError, Label, Modal, TextArea, TextField } from "@heroui/react";

import { TENANT_REVIEW_MAX_COMMENT_LENGTH, validateTenantReview } from "@repo/utils";

import StarRatingInput from "@/app/browse/[apartmentId]/rate-apartment/components/StarRatingInput";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import { submitTenantReview } from "@/service/tenantReviewService";

interface RateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenancyId: string;
  tenantName: string;
  apartmentName: string;
  /** The landlord's existing rating for this stay; saving then edits it. */
  initialRating?: number;
  initialComment?: string | null;
  /** Called after the database accepted the rating. */
  onSaved: () => void;
}

/** Rate a tenant for one finished stay; one rating per tenancy, editable later. */
export default function RateTenantModal({
  isOpen,
  onClose,
  tenancyId,
  tenantName,
  apartmentName,
  initialRating = 0,
  initialComment = "",
  onSaved,
}: RateTenantModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment ?? "");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = initialRating > 0;

  const handleOpenChange = (open: boolean) => {
    if (open || saving) return;
    // Drafts never outlive the modal: reseed from the saved rating next time.
    setRating(initialRating);
    setComment(initialComment ?? "");
    setRatingError(null);
    setCommentError(null);
    setSubmitError(null);
    onClose();
  };

  const handleSave = async () => {
    if (saving) return;
    const errors = validateTenantReview(rating, comment);
    setRatingError(errors.rating ?? null);
    setCommentError(errors.comment ?? null);
    if (errors.rating || errors.comment) return;

    setSaving(true);
    setSubmitError(null);
    const result = await submitTenantReview({ tenancyId, rating, comment });
    setSaving(false);
    if (!result.success) {
      setSubmitError(result.error);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isDismissable={!saving}
        isKeyboardDismissDisabled={saving}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-3xl">
            <Modal.CloseTrigger className="text-card-foreground" />
            <Modal.Header>
              <Modal.Heading className="text-base font-nunito font-semibold">
                {isEditing ? "Edit your rating" : `Rate ${tenantName}`}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How was {tenantName} as a tenant at {apartmentName}? Other landlords you share an
                application or lease with can see your rating.
              </p>

              <div className="space-y-2">
                <Label className="block text-sm font-medium text-card-foreground">
                  Rating <span className="text-danger">*</span>
                </Label>
                <StarRatingInput
                  value={rating}
                  onChange={(value) => {
                    setRating(Math.ceil(value));
                    setRatingError(null);
                  }}
                />
                {ratingError ? <p className="text-xs text-danger">{ratingError}</p> : null}
              </div>

              <TextField
                isInvalid={!!commentError}
                value={comment}
                onChange={(value: string) => {
                  setComment(value);
                  setCommentError(null);
                }}
              >
                <Label>Comment (optional)</Label>
                <TextArea
                  placeholder="Paid on time, kept the unit tidy, easy to communicate with…"
                  rows={4}
                  maxLength={TENANT_REVIEW_MAX_COMMENT_LENGTH + 100}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {comment.trim().length}/{TENANT_REVIEW_MAX_COMMENT_LENGTH}
                </p>
                <FieldError>{commentError}</FieldError>
              </TextField>

              {submitError ? <ErrorBanner message={submitError} /> : null}
            </Modal.Body>

            <Modal.Footer className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                isDisabled={saving}
                onPress={() => handleOpenChange(false)}
                className="flex-1 cursor-pointer rounded-full font-nunito"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                isPending={saving}
                onPress={() => void handleSave()}
                className="flex-1 cursor-pointer rounded-full font-nunito"
              >
                {isEditing ? "Save changes" : "Submit rating"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
