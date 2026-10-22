import { useState } from "react";
import { Keyboard } from "react-native";
import {
  budgetCategoryOptions,
  financeBudgetMonthsDefault,
  financeGoalFromForm,
  formatPesoDisplay,
  isBudgetCategoryAllowed,
  parseFinanceAmount,
  type BudgetKind,
  type FinanceBudget,
  type FinanceCategory,
} from "@repo/utils";
import {
  financeErrorMessage,
  type FinanceProperty,
} from "@/service/finance/financeService";

export interface BudgetEntryFormOptions {
  properties: FinanceProperty[];
  apartmentId: string | null;
  month: string;
  initial?: FinanceBudget;
  presetCategory?: FinanceCategory;
  presetKind?: BudgetKind;
  /** Validated suggestion the landlord chose to review; never auto-saved. */
  suggestedAmount?: number;
  onClose: () => void;
  onSave: (budget: Omit<FinanceBudget, "id">) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export interface BudgetGoalDraft {
  /** Raw peso draft; an empty value means the plan has no goal. */
  target: string;
  months: string;
}

export function useBudgetEntryForm({
  properties,
  apartmentId,
  month,
  initial,
  presetCategory,
  presetKind,
  suggestedAmount,
  onClose,
  onSave,
  onDelete,
}: BudgetEntryFormOptions) {
  // A new plan starts without a property unless the report is already scoped
  // to one; the landlord chooses it, and Save stays blocked until they do.
  const seedProperty = initial?.apartment_id ?? apartmentId ?? "";
  const seedKind = initial?.kind ?? presetKind ?? "expense";
  const seedCategory =
    initial?.category ??
    (presetCategory && isBudgetCategoryAllowed(seedKind, presetCategory)
      ? presetCategory
      : "maintenance");
  const seedMonths =
    initial?.months_remaining ?? financeBudgetMonthsDefault(seedCategory);
  const seedAmount = suggestedAmount ?? initial?.amount;
  const [property, setProperty] = useState(seedProperty);
  const [category, setCategory] = useState<FinanceCategory>(seedCategory);
  const [kind, setKind] = useState<BudgetKind>(seedKind);
  const [amount, setAmount] = useState(
    seedAmount !== undefined ? String(seedAmount) : "",
  );
  const [target, setTarget] = useState(
    initial?.target_amount ? String(initial.target_amount) : "",
  );
  const [months, setMonths] = useState(String(seedMonths));
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const amountValue = parseFinanceAmount(amount, true);
  const goal = financeGoalFromForm(target, months);
  const targetValue = goal.target_amount;
  const monthsValue = goal.months_remaining ?? 0;
  const propertyError = properties.some((item) => item.id === property)
    ? undefined
    : "Choose one of your properties.";
  const kindError =
    kind === "expense" || kind === "reserve"
      ? undefined
      : "Choose a plan type.";
  const categoryError = budgetCategoryOptions(kind).some(
    (item) => item.id === category,
  )
    ? undefined
    : "Choose a budget category.";
  const goalSummary =
    targetValue !== null && monthsValue >= 1
      ? `${formatPesoDisplay(targetValue)} over ${monthsValue} ${monthsValue === 1 ? "month" : "months"}`
      : null;

  // The goal sheet validates before applying; dismissal never changes this draft.
  const applyGoal = (goal: BudgetGoalDraft, suggested?: number) => {
    setTarget(goal.target);
    setMonths(goal.months.trim() ? goal.months : String(seedMonths));
    if (suggested !== undefined) setAmount(String(suggested));
    setGoalSheetOpen(false);
  };
  const handleSave = async () => {
    if (busy) return;
    setSubmitted(true);
    if (amountValue === null || propertyError || kindError || categoryError)
      return;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      await onSave({
        apartment_id: property,
        month,
        category,
        kind,
        amount: amountValue,
        target_amount: goal.target_amount,
        months_remaining: goal.months_remaining,
      });
      onClose();
    } catch (err) {
      console.error("Finance budget save failed");
      setError(financeErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const handleDelete = async () => {
    if (busy || !initial || !onDelete) return;
    setBusy(true);
    try {
      await onDelete(initial.id);
      onClose();
    } catch (err) {
      console.error("Finance budget delete failed");
      setError(financeErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const close = () => {
    if (!busy) {
      Keyboard.dismiss();
      onClose();
    }
  };

  return {
    property,
    setProperty,
    category,
    setCategory,
    kind,
    setKind,
    amount,
    setAmount,
    target,
    months,
    goalSheetOpen,
    setGoalSheetOpen,
    goalSummary,
    applyGoal,
    submitted,
    busy,
    error,
    confirmDelete,
    setConfirmDelete,
    amountValue,
    propertyError,
    kindError,
    categoryError,
    handleSave,
    handleDelete,
    close,
  };
}
