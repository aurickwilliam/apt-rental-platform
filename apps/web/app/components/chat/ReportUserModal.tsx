"use client";

import { useState } from "react";
import { Button, Modal, Radio, RadioGroup, Spinner, TextArea } from "@heroui/react";
import { IconFlag, IconX } from "@tabler/icons-react";
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
  const needsDetails = reason === "other";

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
            <Modal.CloseTrigger className="maintenance-modal-close" aria-label="Close report dialog" isDisabled={isSubmitting}>
              <IconX size={16} aria-hidden="true" />
            </Modal.CloseTrigger>
            <Modal.Header className="pr-12">
              <Modal.Heading className="flex items-center gap-2 text-base font-semibold text-danger">
                <IconFlag size={18} className="shrink-0" aria-hidden="true" />
                Report {name}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Our team reviews every report. Your name is not shared with the person or listing owner.
              </p>
              <RadioGroup
                aria-label="Reason for reporting"
                value={reason ?? ""}
                onChange={(value) => setReason(String(value))}
                isDisabled={isSubmitting}
                className="report-reason-radios flex flex-col gap-2"
              >
                {reasons.map((option) => (
                  <Radio key={option.value} value={option.value} className="w-full min-w-0 cursor-pointer">
                    <Radio.Content className="flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50 data-[selected=true]:border-primary data-[selected=true]:bg-primary/5">
                      <Radio.Control className="mt-0.5 shrink-0">
                        <Radio.Indicator />
                      </Radio.Control>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
                      </span>
                    </Radio.Content>
                  </Radio>
                ))}
              </RadioGroup>
              <TextArea
                aria-label={needsDetails ? "Details (required)" : "Details (optional)"}
                placeholder={needsDetails ? "Tell us what happened (required)" : "Add details (optional)"}
                value={details}
                maxLength={USER_REPORT_DETAILS_MAX_LENGTH}
                onChange={(event) => setDetails(event.target.value)}
                disabled={isSubmitting}
                rows={3}
                fullWidth
              />
              {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex gap-2">
              <Button variant="outline" size="sm" onPress={onClose} isDisabled={isSubmitting} className="flex-1 rounded-full">
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onPress={() => reason && onSubmit(reason, details)}
                isDisabled={!reason || (needsDetails && !details.trim()) || isSubmitting}
                className="flex-1 rounded-full"
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
