"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { IconCheck, type Icon } from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import {
  DEFAULT_RENTAL_QUICK_ACTION_IDS,
  MAX_RENTAL_QUICK_ACTIONS,
  toggleRentalQuickAction,
  type RentalQuickActionId,
} from "@/lib/rental-quick-actions";

export interface QuickActionOption {
  id: RentalQuickActionId;
  label: string;
  hint: string;
  icon: Icon;
  /** Set when the action cannot be used right now (it stays listed, disabled). */
  unavailableReason?: string;
}

interface RentalQuickActionsEditorProps {
  options: readonly QuickActionOption[];
  selectedIds: readonly RentalQuickActionId[];
  /** Stores the choice; false when it could not be saved. */
  onSave: (ids: RentalQuickActionId[]) => boolean;
  onClose: () => void;
}

/**
 * Pick up to five My Rental shortcuts. Mounted only while open, so the draft
 * always starts from the saved choice and is dropped on close.
 */
export default function RentalQuickActionsEditor({ options, selectedIds, onSave, onClose }: RentalQuickActionsEditorProps) {
  const [draft, setDraft] = useState<RentalQuickActionId[]>([...selectedIds]);
  const [saveFailed, setSaveFailed] = useState(false);
  const isFull = draft.length >= MAX_RENTAL_QUICK_ACTIONS;

  const handleSave = () => {
    if (onSave(draft)) onClose();
    else setSaveFailed(true);
  };

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container size="md" scroll="inside">
          <Modal.Dialog>
            <Modal.Header>
              <Modal.Heading>Customize quick actions</Modal.Heading>
              <p className="mt-1 font-inter text-sm text-muted-foreground" aria-live="polite">
                Choose up to {MAX_RENTAL_QUICK_ACTIONS} shortcuts. They appear in the order you pick them. {draft.length} of {MAX_RENTAL_QUICK_ACTIONS} chosen.
              </p>
            </Modal.Header>
            <Modal.Body className="space-y-2">
              {options.map((option) => {
                const position = draft.indexOf(option.id);
                const selected = position !== -1;
                const OptionIcon = option.icon;
                return (
                  <Button
                    key={option.id}
                    variant="ghost"
                    aria-pressed={selected}
                    isDisabled={!selected && (Boolean(option.unavailableReason) || isFull)}
                    onPress={() => setDraft((current) => toggleRentalQuickAction(current, option.id))}
                    className={`button--bare flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors ${selected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}
                  >
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      <OptionIcon size={20} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-nunito text-sm font-semibold text-card-foreground">{option.label}</span>
                      <span className="block font-inter text-xs text-muted-foreground">{option.unavailableReason ?? option.hint}</span>
                    </span>
                    {selected && (
                      <span className="flex shrink-0 items-center gap-1 font-inter text-xs font-semibold text-primary">
                        <IconCheck size={16} aria-hidden="true" />
                        {position + 1}
                      </span>
                    )}
                  </Button>
                );
              })}
              {isFull && (
                <p className="font-inter text-xs text-muted-foreground">
                  All {MAX_RENTAL_QUICK_ACTIONS} spots are taken. Remove one to add another.
                </p>
              )}
              {saveFailed && <ErrorBanner message="Your changes could not be saved in this browser. Please try again." />}
            </Modal.Body>
            <Modal.Footer className="flex gap-3">
              <Button
                variant="tertiary"
                className="flex-1 cursor-pointer"
                onPress={() => setDraft([...DEFAULT_RENTAL_QUICK_ACTION_IDS])}
              >
                Reset
              </Button>
              <Button className="flex-1 cursor-pointer" onPress={handleSave}>
                Save changes
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
