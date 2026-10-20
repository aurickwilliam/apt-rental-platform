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
  financeCategoryLabel,
  financeGoalFromForm,
  financeMonthLabel,
  formatPesoDisplay,
  handlePesoChange,
  isBudgetCategoryAllowed,
  parseFinanceAmount,
  suggestFinanceBudget,
  type BudgetKind,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceProperty,
  type FinanceScope,
} from "@repo/utils";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import type { FinanceOperation } from "@/hooks/use-landlord-finances";
import FinanceModal from "./FinanceModal";

interface PlanBudgetModalProps {
  scope: FinanceScope;
  properties: FinanceProperty[];
  presetCategory?: FinanceCategory;
  presetKind?: BudgetKind;
  operation: FinanceOperation;
  onSave: (budget: Omit<FinanceBudget, "id">) => Promise<boolean>;
  onClose: () => void;
}

/** Creation is needed by Overview's emergency-reserve action; the same form
 * can launch ordinary plans without introducing a second reserve workflow. */
export default function PlanBudgetModal({
  scope,
  properties,
  presetCategory = "maintenance",
  presetKind = "expense",
  operation,
  onSave,
  onClose,
}: PlanBudgetModalProps) {
  const [property, setProperty] = useState(
    scope.apartmentId ?? properties[0]?.id ?? "",
  );
  const [kind, setKind] = useState(presetKind);
  const [category, setCategory] = useState(presetCategory);
  const [amount, setAmount] = useState("");
  const [target, setTarget] = useState("");
  const [months, setMonths] = useState(
    String(financeBudgetMonthsDefault(presetCategory)),
  );
  const [submitted, setSubmitted] = useState(false);
  const parsedAmount = parseFinanceAmount(amount, true);
  const goal = financeGoalFromForm(target, months);
  const suggestion = suggestFinanceBudget({
    category,
    kind,
    target_amount: goal.target_amount,
    months_remaining: goal.months_remaining,
  });
  const validProperty = properties.some((item) => item.id === property);
  const amountError =
    submitted && parsedAmount === null
      ? "Enter zero or a positive amount with at most two decimals."
      : null;
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (operation.pending) return;
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
      month: scope.month,
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
  return (
    <FinanceModal
      title="Plan a budget"
      description={`${financeMonthLabel(scope.month)} · plans do not move or hold money.`}
      busy={operation.pending}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button
            variant="tertiary"
            className="flex-1"
            isDisabled={operation.pending}
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            form="finance-budget-form"
            type="submit"
            className="flex-1"
            isPending={operation.pending}
            isDisabled={operation.pending}
          >
            Save budget
          </Button>
        </div>
      }
    >
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
            isDisabled={operation.pending}
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
            isDisabled={operation.pending}
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
            isDisabled={operation.pending}
            onChange={(value) => setCategory(value as FinanceCategory)}
          />
        </div>
        <TextField
          isRequired
          isInvalid={!!amountError}
          isDisabled={operation.pending}
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
        <TextField
          isInvalid={submitted && !!goal.targetError}
          isDisabled={operation.pending}
          value={target === "." ? "." : formatPesoDisplay(target)}
          onChange={(value) => setTarget(handlePesoChange(value).raw)}
        >
          <Label>Amount still needed / annual bill (optional)</Label>
          <Input inputMode="decimal" maxLength={20} placeholder="₱ 0" />
          <FieldError>{goal.targetError}</FieldError>
        </TextField>
        <TextField
          isInvalid={submitted && !!goal.monthsError}
          isDisabled={operation.pending}
          value={months}
          onChange={setMonths}
        >
          <Label>Months to spread this amount over</Label>
          <Input inputMode="numeric" maxLength={3} />
          <FieldError>{goal.monthsError}</FieldError>
        </TextField>
        {suggestion ? (
          <div className="space-y-2 rounded-xl bg-secondary p-3 text-sm">
            <p className="font-nunito font-bold">
              {financeCategoryLabel(category)} ·{" "}
              {formatPesoDisplay(suggestion.amount)} / month
            </p>
            <p>{suggestion.basis}</p>
            <Button
              variant="tertiary"
              size="sm"
              isDisabled={operation.pending}
              onPress={() => setAmount(String(suggestion.amount))}
            >
              Use suggestion
            </Button>
          </div>
        ) : null}
        {operation.error ? (
          <p role="alert" className="text-sm text-destructive">
            {operation.error}
          </p>
        ) : null}
      </Form>
    </FinanceModal>
  );
}
