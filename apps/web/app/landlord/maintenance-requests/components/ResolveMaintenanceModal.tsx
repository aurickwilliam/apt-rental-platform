"use client";

import { useState } from "react";
import { Button, FieldError, Label, Modal, TextArea, TextField } from "@heroui/react";

type ResolveMaintenanceModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  onConfirm: (notes: string) => void;
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

  const close = (open: boolean) => {
    if (!open && isSubmitting) return;
    if (!open) {
      setNotes("");
      setNotesError("");
    }
    onOpenChange(open);
  };

  const handleConfirm = () => {
    if (!notes.trim()) {
      setNotesError("Please enter resolution notes.");
      return;
    }
    setNotesError("");
    onConfirm(notes.trim());
    setNotes("");
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={close}>
      <Modal.Backdrop>
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Resolve maintenance request</Modal.Heading>
            </Modal.Header>
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
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onPress={() => close(false)}>
                Cancel
              </Button>
              <Button size="sm" isDisabled={isSubmitting} onPress={handleConfirm}>
                {isSubmitting ? "Resolving..." : "Mark as Resolved"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
