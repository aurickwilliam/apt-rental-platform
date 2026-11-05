"use client";

import { useState, useTransition } from "react";
import { Button, Description, Label, Modal, Radio, RadioGroup, TextArea } from "@heroui/react";
import { SUSPENSION_DURATIONS } from "@/lib/suspension-duration";
import type { OperationResult } from "./actions/operations";

interface OperationFormProps {
  id: string;
  decision: "suspend" | "reactivate" | "hide" | "restore" | "resolve" | "dismiss" | "warn" | "hide_listing" | "suspend_user";
  onSubmit: (formData: FormData) => Promise<OperationResult>;
  label?: string;
}

const COPY = {
  suspend: "Future sign-ins will be blocked and this account will lose access to protected data immediately. Existing access tokens may remain valid until expiry.",
  reactivate: "This account will be allowed to sign in again.",
  hide: "This listing will disappear from public discovery. Existing tenancy, payment, and verification history will remain available.",
  restore: "This listing will become visible in discovery again, subject to its normal availability status.",
  resolve: "The report will be closed as handled. Suspend or hide content separately if needed; the note is kept in the activity log.",
  dismiss: "The report will be closed with no action. The note is kept in the activity log.",
  warn: "The reported person gets a warning notification with this note, and the report is closed.",
  hide_listing: "The reported listing disappears from public discovery and the report is closed. The owner can still see it. The note is kept in the activity log.",
  suspend_user: "The reported account is suspended and signed out everywhere, and the report is closed. The note is kept in the activity log.",
};

// Report decisions record a review note rather than a change reason.
const NOTE_LABEL: Partial<Record<OperationFormProps["decision"], string>> = {
  resolve: "Review note",
  dismiss: "Review note",
  warn: "Warning message",
  hide_listing: "Reason for hiding",
  suspend_user: "Reason for suspending",
};

export default function OperationForm({ id, decision, onSubmit, label }: OperationFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [duration, setDuration] = useState<string>("permanent");
  const buttonLabel = label ?? decision[0].toUpperCase() + decision.slice(1);

  return (
    <>
      {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
      <Button
        variant={decision === "hide" || decision === "suspend" || decision === "hide_listing" || decision === "suspend_user" ? "danger-soft" : decision === "dismiss" ? "secondary" : "primary"}
        onPress={() => { setError(null); setOpen(true); }}
      >
        {buttonLabel}
      </Button>
      <Modal isOpen={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Confirm {buttonLabel.toLowerCase()}</Modal.Heading></Modal.Header>
              <form onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                formData.set("id", id);
                formData.set("decision", decision);
                startTransition(async () => {
                  try {
                    const result = await onSubmit(formData);
                    if (result.error) { setError(result.error); return; }
                    setError(null);
                    setOpen(false);
                  } catch (error) {
                    console.error("Admin operation failed", error);
                    setError("The operation could not be completed. Refresh and try again.");
                  }
                });
              }}>
                <Modal.Body className="space-y-4">
                  <p className="text-sm text-muted-foreground">{COPY[decision]}</p>
                  {decision === "suspend" || decision === "suspend_user" ? (
                    <RadioGroup
                      aria-label="How long the suspension lasts"
                      value={duration}
                      onChange={(value) => setDuration(String(value))}
                      isDisabled={pending}
                    >
                      <Label>How long</Label>
                      {SUSPENSION_DURATIONS.map((option) => (
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
                      <input type="hidden" name="duration" value={duration} />
                    </RadioGroup>
                  ) : null}
                  <TextArea name="reason" required minLength={3} maxLength={500} aria-label={NOTE_LABEL[decision] ?? "Reason for this change"} placeholder={`${NOTE_LABEL[decision] ?? "Reason for this change"}…`}>
                    <Label>{NOTE_LABEL[decision] ?? "Reason"} *</Label>
                  </TextArea>
                  {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                </Modal.Body>
                <Modal.Footer>
                  <Button type="button" variant="secondary" onPress={() => setOpen(false)} isDisabled={pending}>Cancel</Button>
                  <Button type="submit" variant={decision === "hide" || decision === "suspend" || decision === "hide_listing" || decision === "suspend_user" ? "danger" : "primary"} isDisabled={pending}>
                    {pending ? "Saving…" : `Confirm ${buttonLabel.toLowerCase()}`}
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
