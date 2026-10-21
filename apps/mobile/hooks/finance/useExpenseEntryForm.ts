import { useState } from "react";
import { Keyboard } from "react-native";
import { randomUUID } from "expo-crypto";
import {
  budgetCategoryOptions,
  financeCategoryTreatmentDefault,
  financeExpenseDateDefault,
  MAX_FINANCE_DESCRIPTION_LENGTH,
  parseFinanceAmount,
  validateExpenseDate,
  type ExpenseTreatment,
  type FinanceCategory,
} from "@repo/utils";
import {
  financeErrorMessage,
  type ExpenseDraft,
  type ExpenseRecord,
  type FinanceProperty,
} from "@/service/finance/financeService";

export const EXPENSE_CATEGORY_OPTIONS = budgetCategoryOptions("expense");
export const MAX_EXPENSE_DESCRIPTION_LENGTH = MAX_FINANCE_DESCRIPTION_LENGTH;

export interface ExpenseEntryFormOptions {
  /** Keep sheets mounted and reseed their draft on each closed → open transition. */
  isOpen: boolean;
  properties: FinanceProperty[];
  apartmentId: string | null;
  month: string;
  initial?: ExpenseRecord;
  category?: FinanceCategory | null;
  onClose: () => void;
  onSave: (draft: ExpenseDraft, editing: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function useExpenseEntryForm({
  isOpen,
  properties,
  apartmentId,
  month,
  initial,
  category: initialCategory,
  onClose,
  onSave,
  onDelete,
}: ExpenseEntryFormOptions) {
  const seedCategory = initial?.category ?? initialCategory ?? "maintenance";
  const seedTreatment =
    initial?.treatment ?? financeCategoryTreatmentDefault(seedCategory);
  const seedDate = initial?.spent_on ?? financeExpenseDateDefault(month);
  const [id, setId] = useState(() => initial?.id ?? randomUUID());
  // A new expense starts without a property unless the report is scoped to one.
  const [property, setProperty] = useState(
    initial?.apartment_id ?? apartmentId ?? "",
  );
  const [category, setCategory] = useState<FinanceCategory>(seedCategory);
  const [treatment, setTreatment] = useState<ExpenseTreatment>(seedTreatment);
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(seedDate);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [wasOpen, setWasOpen] = useState(isOpen);

  // Never reseed on a background refetch; only a new opening starts a draft.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setId(initial?.id ?? randomUUID());
      setProperty(initial?.apartment_id ?? apartmentId ?? "");
      setCategory(seedCategory);
      setTreatment(seedTreatment);
      setAmount(initial ? String(initial.amount) : "");
      setDate(seedDate);
      setDescription(initial?.description ?? "");
      setSubmitted(false);
      setBusy(false);
      setError(null);
      setConfirmDelete(false);
    }
  }

  const amountValue = parseFinanceAmount(amount);
  const dateError = validateExpenseDate(date);
  const propertyError = properties.some((item) => item.id === property)
    ? undefined
    : "Choose one of your properties.";
  const categoryError = EXPENSE_CATEGORY_OPTIONS.some(
    (item) => item.id === category,
  )
    ? undefined
    : "Choose an expense category.";
  const treatmentError =
    treatment === "operating" || treatment === "capital"
      ? undefined
      : "Choose an expense treatment.";
  const descriptionError = !description.trim()
    ? "Describe this expense."
    : description.trim().length > MAX_EXPENSE_DESCRIPTION_LENGTH
      ? "Use 200 characters or fewer."
      : undefined;

  const handleSave = async () => {
    if (busy) return;
    setSubmitted(true);
    if (
      amountValue === null ||
      dateError ||
      propertyError ||
      categoryError ||
      treatmentError ||
      descriptionError
    )
      return;
    Keyboard.dismiss();
    setBusy(true);
    setError(null);
    try {
      await onSave(
        {
          id,
          apartment_id: property,
          category,
          treatment,
          amount: amountValue,
          spent_on: date,
          description: description.trim(),
        },
        !!initial,
      );
      onClose();
    } catch (err) {
      console.error(
        "Finance expense save failed",
        err && typeof err === "object" && "code" in err ? err.code : "unknown",
      );
      setError(financeErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  const handleDelete = async () => {
    if (busy || !initial || !onDelete) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete(initial.id);
      onClose();
    } catch (err) {
      console.error("Finance expense delete failed");
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
    treatment,
    setTreatment,
    amount,
    setAmount,
    date,
    setDate,
    description,
    setDescription,
    submitted,
    busy,
    error,
    confirmDelete,
    setConfirmDelete,
    amountValue,
    dateError,
    propertyError,
    categoryError,
    treatmentError,
    descriptionError,
    handleSave,
    handleDelete,
    close,
  };
}
