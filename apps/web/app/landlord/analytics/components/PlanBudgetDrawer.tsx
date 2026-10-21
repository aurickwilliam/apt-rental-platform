"use client";

import { useState } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  toast,
} from "@heroui/react";
import {
  budgetCategoryOptions,
  financeBudgetMonthsDefault,
  financeGoalFromForm,
  financeMonthLabel,
  formatPesoDisplay,
  handlePesoChange,
  isBudgetCategoryAllowed,
  parseFinanceAmount,
  type BudgetKind,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceProperty,
  type FinanceScope,
} from "@repo/utils";
import { IconCalculator, IconTrash } from "@tabler/icons-react";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import type { FinanceOperation } from "@/hooks/use-landlord-finances";
import BudgetGoalModal from "./BudgetGoalModal";
import FinanceDrawer from "./FinanceDrawer";

interface PlanBudgetDrawerProps {
  scope: FinanceScope;
  properties: FinanceProperty[];
  presetCategory?: FinanceCategory;
  presetKind?: BudgetKind;
  /** A saved plan turns this into the edit form: identity fields lock. */
  initial?: FinanceBudget;
  operation: FinanceOperation;
  /** Removal is its own operation; absent while creating. */
  removing?: FinanceOperation;
  onSave: (budget: Omit<FinanceBudget, "id">) => Promise<boolean>;
  /** Absent while creating — a plan that does not exist cannot be removed. */
  onDelete?: (id: string) => Promise<boolean>;
  onClose: () => void;
}

/** Creation is needed by Overview's emergency-reserve action; the same form
 * can launch ordinary plans without introducing a second reserve workflow. */
export default function PlanBudgetDrawer({
  scope,
  properties,
  presetCategory = "maintenance",
  presetKind = "expense",
  initial,
  operation,
  removing,
  onSave,
  onDelete,
  onClose,
}: PlanBudgetDrawerProps) {
  const editing = !!initial;
  const busy = operation.pending || !!removing?.pending;
  const [property, setProperty] = useState(
    initial?.apartment_id ?? scope.apartmentId ?? properties[0]?.id ?? "",
  );
  const [kind, setKind] = useState<BudgetKind>(initial?.kind ?? presetKind);
  const [category, setCategory] = useState<FinanceCategory>(
    initial?.category ??
      (isBudgetCategoryAllowed(presetKind, presetCategory)
        ? presetCategory
        : "maintenance"),
  );
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : "",
  );
  const [target, setTarget] = useState(
    initial?.target_amount ? String(initial.target_amount) : "",
  );
  const [months, setMonths] = useState(
    String(initial?.months_remaining ?? financeBudgetMonthsDefault(category)),
  );
  const [goalOpen, setGoalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const parsedAmount = parseFinanceAmount(amount, true);
  const goal = financeGoalFromForm(target, months);
  const goalSummary =
    goal.target_amount !== null && !goal.monthsError
      ? `${formatPesoDisplay(goal.target_amount)} over ${goal.months_remaining} ${goal.months_remaining === 1 ? "month" : "months"}`
      : null;
  const validProperty = properties.some((item) => item.id === property);
  const amountError =
    submitted && parsedAmount === null
      ? "Enter zero or a positive amount with at most two decimals."
      : null;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    operation.clearError();
    setSubmitted(true);
    if (
      !validProperty ||
      !isBudgetCategoryAllowed(kind, category) ||
      parsedAmount === null ||
      goal.targetError ||
      goal.monthsError
    ) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            '#finance-budget-form [aria-invalid="true"] input, #finance-budget-form input[aria-invalid="true"]',
          )
          ?.focus(),
      );
      return;
    }
    const ok = await onSave({
      apartment_id: property,
      // A saved plan keeps its own month, so editing never moves it.
      month: initial?.month ?? scope.month,
      category,
      kind,
      amount: parsedAmount,
      target_amount: goal.target_amount,
      months_remaining: goal.months_remaining,
    });
    if (ok) {
      toast.success("Budget saved");
      onClose();
    }
  };
  const remove = async () => {
    if (!initial || !onDelete || busy) return;
    const ok = await onDelete(initial.id);
    // Removal closes quietly, like the expense editor.
    if (ok) onClose();
  };
  return (
    <FinanceDrawer
      title={editing ? "Edit budget" : "Plan a budget"}
      description={`${financeMonthLabel(initial?.month ?? scope.month)} · plans do not move or hold money.`}
      busy={busy}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button
            variant="tertiary"
            className="flex-1"
            isDisabled={busy}
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            form="finance-budget-form"
            type="submit"
            className="flex-1"
            isPending={busy}
            isDisabled={busy}
          >
            Save budget
          </Button>
        </div>
      }
    >
      {editing ? (
        <p className="text-xs text-muted-foreground">
          Property, plan type, category and month are locked for a saved plan.
          Change the amount or the optional goal instead.
        </p>
      ) : null}
      <Form
        id="finance-budget-form"
        onSubmit={(event) => void submit(event)}
        validationBehavior="aria"
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label>
            Property <span className="text-destructive">*</span>
          </Label>
          <SettingsSelect
            label="Property"
            className="w-full"
            value={property}
            options={properties.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            isDisabled={busy || editing}
            onChange={setProperty}
          />
          {submitted && !validProperty ? (
            <p role="alert" className="text-sm text-destructive">
              Choose one of your properties.
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>
            Plan type <span className="text-destructive">*</span>
          </Label>
          <SettingsSelect
            label="Plan type"
            className="w-full"
            value={kind}
            options={[
              { value: "expense", label: "Spending budget" },
              { value: "reserve", label: "Planned reserve" },
            ]}
            isDisabled={busy || editing}
            onChange={(value) => {
              const next = value as BudgetKind;
              setKind(next);
              if (!isBudgetCategoryAllowed(next, category))
                setCategory("maintenance");
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <SettingsSelect
            label="Category"
            className="w-full"
            value={category}
            options={budgetCategoryOptions(kind).map((item) => ({
              value: item.id,
              label: item.label,
            }))}
            isDisabled={busy || editing}
            onChange={(value) => setCategory(value as FinanceCategory)}
          />
        </div>
        <TextField
          isRequired
          isInvalid={!!amountError}
          isDisabled={busy}
          value={amount === "." ? "." : formatPesoDisplay(amount)}
          onChange={(value) => setAmount(handlePesoChange(value).raw)}
        >
          <Label>
            {kind === "reserve"
              ? "Planned allocation this month"
              : "Monthly spending limit"}
          </Label>
          <Input inputMode="decimal" maxLength={20} placeholder="₱ 0" />
          <FieldError>{amountError}</FieldError>
        </TextField>
        <div className="space-y-2">
          <Button
            variant="secondary"
            className="w-full"
            isDisabled={busy}
            aria-haspopup="dialog"
            onPress={() => setGoalOpen(true)}
          >
            <IconCalculator size={16} aria-hidden />
            Calculate from a goal
          </Button>
          {goalSummary ? (
            <p className="text-sm text-muted-foreground">
              Goal: {goalSummary}
            </p>
          ) : null}
          {submitted && (goal.targetError || goal.monthsError) ? (
            <p role="alert" className="text-sm text-destructive">
              {goal.targetError ?? goal.monthsError}
            </p>
          ) : null}
        </div>
        {operation.error || removing?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {operation.error ?? removing?.error}
          </p>
        ) : null}
      </Form>
      {initial && onDelete ? (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {confirmRemove ? (
            <p className="text-sm text-destructive">
              Remove this plan? The limit and any goal stop applying to this
              month.
            </p>
          ) : null}
          <Button
            variant="danger-soft"
            className="w-full"
            isDisabled={busy}
            onPress={() =>
              confirmRemove ? void remove() : setConfirmRemove(true)
            }
          >
            <IconTrash size={16} aria-hidden />
            {confirmRemove ? "Confirm remove budget" : "Remove budget"}
          </Button>
        </div>
      ) : null}
      {goalOpen ? (
        <BudgetGoalModal
          category={category}
          kind={kind}
          goal={{ target, months }}
          onClose={() => setGoalOpen(false)}
          onApply={(next, suggestedAmount) => {
            setTarget(next.target);
            setMonths(next.months.trim() ? next.months : months);
            setAmount(String(suggestedAmount));
            setGoalOpen(false);
          }}
        />
      ) : null}
    </FinanceDrawer>
  );
}
