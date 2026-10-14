"use client";

import { useState, useTransition } from "react";
import { Button, Label, Modal, TextArea } from "@heroui/react";
import type { OperationResult } from "./actions/operations";

interface OperationFormProps {
  id: string;
  decision: "suspend" | "reactivate" | "hide" | "restore" | "resolve" | "dismiss";
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
};

// Report decisions record a review note rather than a change reason.
const NOTE_LABEL: Partial<Record<OperationFormProps["decision"], string>> = {
  resolve: "Review note",
  dismiss: "Review note",
};

export default function OperationForm({ id, decision, onSubmit, label }: OperationFormProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const buttonLabel = label ?? decision[0].toUpperCase() + decision.slice(1);

  return (
    <>
      {error && <p role="alert" className="mb-3 text-sm text-danger">{error}</p>}
      <Button
        variant={decision === "hide" || decision === "suspend" ? "danger-soft" : decision === "dismiss" ? "secondary" : "primary"}
        onPress={() => { setError(null); setOpen(true); }}
      >
        {buttonLabel}
      </Button>
      <Modal isOpen={open} onOpenChange={(value) => { if (!pending) setOpen(value); }}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Confirm {decision}</Modal.Heading></Modal.Header>
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
                  <TextArea name="reason" required minLength={3} maxLength={500} aria-label={NOTE_LABEL[decision] ?? "Reason for this change"} placeholder={`${NOTE_LABEL[decision] ?? "Reason for this change"}…`}>
                    <Label>{NOTE_LABEL[decision] ?? "Reason"} *</Label>
                  </TextArea>
                  {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                </Modal.Body>
                <Modal.Footer>
                  <Button type="button" variant="secondary" onPress={() => setOpen(false)} isDisabled={pending}>Cancel</Button>
                  <Button type="submit" variant={decision === "hide" || decision === "suspend" ? "danger" : "primary"} isDisabled={pending}>
                    {pending ? "Saving…" : `Confirm ${decision}`}
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
