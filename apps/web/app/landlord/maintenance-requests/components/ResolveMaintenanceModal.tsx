"use client";

import { useState } from "react";
import { Button, Checkbox, FieldError, Label, Modal, NumberField, TextArea, TextField } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";

type ResolveMaintenanceModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onConfirm: (notes: string, feeAmount?: number) => void;
  isSubmitting?: boolean;
};

export default function ResolveMaintenanceModal({
  isOpen,
  onOpenChange,
  tenantName,
  onConfirm,
  isSubmitting = false,
}: ResolveMaintenanceModalProps) {
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState("");
  // Optional maintenance fee charged to the tenant, persisted atomically
  // with the resolve action (fee_status 'pending' = added to next rent).
  const [chargeFee, setChargeFee] = useState(false);
  const [feeAmount, setFeeAmount] = useState<number | undefined>(undefined);
  const [feeError, setFeeError] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const reset = () => {
    setNotes("");
    setNotesError("");
    setChargeFee(false);
    setFeeAmount(undefined);
    setFeeError("");
    setStep("form");
  };

  const close = (open: boolean) => {
    if (!open && isSubmitting) return;
    if (!open) reset();
    onOpenChange(open);
  };

  const handlePrimary = () => {
    if (step === "confirm") {
      setNotesError("");
      setFeeError("");
      // TODO(backend): fee persistence lands here — now wired.
      onConfirm(notes.trim(), chargeFee ? feeAmount : undefined);
      reset();
      return;
    }
    if (!notes.trim()) {
      setNotesError("Please enter resolution notes.");
      return;
    }
    if (chargeFee && (feeAmount === undefined || Number.isNaN(feeAmount) || feeAmount <= 0)) {
      setFeeError("Enter a fee amount greater than ₱0.");
      return;
    }
    setNotesError("");
    setFeeError("");
    // Fee selected → explicit confirmation step before resolving.
    if (chargeFee) {
      setStep("confirm");
      return;
    }
    onConfirm(notes.trim());
    reset();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={close}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>{step === "confirm" ? "Confirm maintenance fee" : "Resolve maintenance request"}</Modal.Heading>
            </Modal.Header>
            {step === "confirm" && chargeFee && feeAmount !== undefined && feeAmount > 0 ? (
              <>
                <Modal.Body className="space-y-3">
                  <p className="text-center text-3xl font-nunito font-bold text-primary">
                    {formatPesoDisplay(feeAmount)}
                  </p>
                  <div className="rounded-xl bg-muted px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Charged to</span>
                      <span className="text-sm font-nunito font-semibold text-card-foreground">{tenantName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Applied to</span>
                      <span className="text-sm font-nunito font-semibold text-card-foreground">Next rent payment</span>
                    </div>
                  </div>
                  <p className="text-sm font-nunito text-muted-foreground">
                    Resolution note: <span className="text-card-foreground">{notes.trim()}</span>
                  </p>
                  <p className="text-sm font-nunito font-semibold text-primary">
                    This fee will be added to {tenantName}&apos;s next rent payment.
                  </p>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" isDisabled={isSubmitting} onPress={() => setStep("form")} className="flex-1">
                    Back
                  </Button>
                  <Button size="sm" isDisabled={isSubmitting} onPress={handlePrimary} className="flex-1">
                    {isSubmitting ? "Resolving..." : "Confirm Resolve"}
                  </Button>
                </Modal.Footer>
              </>
            ) : (
              <>
            <Modal.Body>
              <p className="text-sm font-nunito text-muted-foreground">
                Add a note on how this issue was fixed for {tenantName}. The tenant will see
                this note.
              </p>
              <TextField
                isRequired
                isInvalid={!!notesError}
                value={notes}
                onChange={(v: string) => {
                  setNotes(v);
                  if (v.trim()) setNotesError("");
                }}
              >
                <Label>Resolution notes</Label>
                <TextArea
                  placeholder="e.g. Replaced the faulty valve and tested for leaks."
                  rows={4}
                />
                <FieldError>{notesError}</FieldError>
              </TextField>

              <Checkbox isSelected={chargeFee} onChange={setChargeFee} className="mt-4">
                <Checkbox.Content className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox.Control className="size-5">
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Label className="text-sm text-card-foreground">
                    Charge a maintenance fee to {tenantName}?
                  </Label>
                </Checkbox.Content>
              </Checkbox>

              {chargeFee && (
                <NumberField
                  minValue={0}
                  value={feeAmount}
                  onChange={(value) => {
                    setFeeAmount(typeof value === "number" && !Number.isNaN(value) ? value : undefined);
                    if (typeof value === "number" && value > 0) setFeeError("");
                  }}
                  isRequired
                  isInvalid={!!feeError}
                  formatOptions={{ style: "currency", currency: "PHP" }}
                >
                  <Label>Maintenance fee</Label>
                  <NumberField.Group className="flex items-center w-full bg-card border border-border rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
                    <NumberField.Input placeholder="₱0.00" className="w-full bg-transparent py-2.5 px-3 text-sm text-card-foreground placeholder:text-muted-foreground outline-none" />
                  </NumberField.Group>
                  <FieldError>{feeError}</FieldError>
                  <p className="text-[11px] text-muted-foreground mt-1">Charged on top of rent, not deducted from it.</p>
                </NumberField>
              )}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="danger-soft" size="sm" onPress={() => close(false)} className="flex-1">
                Cancel
              </Button>
              <Button size="sm" isDisabled={isSubmitting} onPress={handlePrimary} className="flex-1">
                {isSubmitting ? "Resolving..." : "Mark as Resolved"}
              </Button>
            </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
