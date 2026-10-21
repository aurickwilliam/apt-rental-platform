"use client";

import { useState } from "react";
import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import {
  financeGoalFromForm,
  formatPesoDisplay,
  handlePesoChange,
  suggestFinanceBudget,
  type BudgetKind,
  type FinanceCategory,
} from "@repo/utils";

import FinanceModal from "./FinanceModal";

export interface BudgetGoalDraft {
  /** Raw peso draft; an empty value means the plan has no goal. */
  target: string;
  months: string;
}

interface BudgetGoalModalProps {
  category: FinanceCategory;
  kind: BudgetKind;
  /** The plan's current goal, seeding the draft each time the modal opens. */
  goal: BudgetGoalDraft;
  /** Applies the goal and the monthly amount the landlord chose to use. */
  onApply: (goal: BudgetGoalDraft, suggestedAmount: number) => void;
  onClose: () => void;
}

/**
 * "Calculate from a goal", mirroring mobile's goal sheet: turn a target or a
 * known bill into a monthly amount. Edits are a draft — closing discards them,
 * and nothing changes in the plan until "Use suggested amount" is pressed.
 */
export default function BudgetGoalModal({
  category,
  kind,
  goal,
  onApply,
  onClose,
}: BudgetGoalModalProps) {
  const [target, setTarget] = useState(goal.target);
  const [months, setMonths] = useState(goal.months);
  const parsed = financeGoalFromForm(target, months);
  const suggestion =
    parsed.target_amount !== null && !parsed.monthsError
      ? suggestFinanceBudget({
          category,
          kind,
          target_amount: parsed.target_amount,
          months_remaining: parsed.months_remaining,
        })
      : null;
  return (
    <FinanceModal
      title="Calculate from a goal"
      description="Turn a target or a known bill into a monthly amount. It stays a plan — no money is moved."
      onClose={onClose}
      footer={
        <Button
          className="w-full"
          isDisabled={!suggestion}
          onPress={() => {
            if (suggestion) onApply({ target, months }, suggestion.amount);
          }}
        >
          Use suggested amount
        </Button>
      }
    >
      <TextField
        isInvalid={!!parsed.targetError}
        value={target === "." ? "." : formatPesoDisplay(target)}
        onChange={(value) => setTarget(handlePesoChange(value).raw)}
      >
        <Label>Amount still needed or annual bill (₱)</Label>
        <Input inputMode="decimal" maxLength={20} placeholder="e.g. 12000" />
        <FieldError>{parsed.targetError}</FieldError>
      </TextField>
      <TextField
        isInvalid={!!parsed.monthsError}
        value={months}
        onChange={setMonths}
      >
        <Label>Months to spread this amount over</Label>
        <Input inputMode="numeric" maxLength={3} />
        <FieldError>{parsed.monthsError}</FieldError>
      </TextField>
      {suggestion ? (
        <div
          aria-live="polite"
          className="space-y-1 rounded-2xl bg-secondary p-3 text-sm"
        >
          <p className="font-nunito font-bold text-primary">
            Suggested: {formatPesoDisplay(suggestion.amount)} / month
          </p>
          <p className="text-muted-foreground">{suggestion.basis}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Enter the amount and the months to see a suggested monthly allocation.
        </p>
      )}
    </FinanceModal>
  );
}
