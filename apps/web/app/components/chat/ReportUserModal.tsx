"use client";

import { useState } from "react";
import { Button, Description, Label, Modal, Radio, RadioGroup, Spinner, TextArea } from "@heroui/react";
import { IconFlag } from "@tabler/icons-react";
import { USER_REPORT_DETAILS_MAX_LENGTH, USER_REPORT_REASONS } from "@repo/utils";

export interface ReportReasonOption {
  value: string;
  label: string;
  description: string;
}

interface ReportUserModalProps {
  /** The person or listing being reported, or null when closed. */
  name: string | null;
  /** Reasons to choose from; people reasons by default. */
  reasons?: readonly ReportReasonOption[];
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

/** Report a person from the Messages list (mobile's `ReportUserDialog`). */
export default function ReportUserModal({
  name,
  reasons = USER_REPORT_REASONS,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: ReportUserModalProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  // Each open starts clean: the draft never outlives the dialog.
  const [lastName, setLastName] = useState<string | null>(name);
  if (lastName !== name) {
    setLastName(name);
    if (name === null) {
      setReason(null);
      setDetails("");
    }
  }

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={name !== null}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) onClose();
        }}
        isDismissable={!isSubmitting}
        isKeyboardDismissDisabled={isSubmitting}
      >
        <Modal.Container placement="center" size="md">
          <Modal.Dialog className="rounded-2xl">
            <Modal.CloseTrigger aria-label="Close report dialog" />
            <Modal.Header className="pr-12">
              <Modal.Heading className="flex items-center gap-2 text-base font-semibold text-danger">
                <IconFlag size={18} className="shrink-0" aria-hidden="true" />
                Report {name}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <RadioGroup
                aria-label="Reason for reporting"
                value={reason ?? ""}
                onChange={(value) => setReason(String(value))}
                isDisabled={isSubmitting}
              >
                {reasons.map((option) => (
                  <Radio key={option.value} value={option.value}>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    <Radio.Content>
                      <Label>{option.label}</Label>
                      <Description>{option.description}</Description>
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
              <TextArea
                aria-label="Details (optional)"
                placeholder="Add details (optional)"
                value={details}
                maxLength={USER_REPORT_DETAILS_MAX_LENGTH}
                onChange={(event) => setDetails(event.target.value)}
                disabled={isSubmitting}
                rows={3}
                fullWidth
              />
              {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onPress={onClose} isDisabled={isSubmitting} className="rounded-full">
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={() => reason && onSubmit(reason, details)}
                isDisabled={!reason || isSubmitting}
                className="rounded-full"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" color="current" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  "Submit report"
                )}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
