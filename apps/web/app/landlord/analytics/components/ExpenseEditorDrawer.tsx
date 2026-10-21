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
import { IconTrash } from "@tabler/icons-react";
import {
  MAX_FINANCE_DESCRIPTION_LENGTH,
  budgetCategoryOptions,
  financeCategoryTreatmentDefault,
  financeExpenseDateDefault,
  formatPesoDisplay,
  handlePesoChange,
  manilaToday,
  parseFinanceAmount,
  validateExpenseDate,
  type ExpenseDraft,
  type ExpenseRecord,
  type ExpenseTreatment,
  type FinanceProperty,
} from "@repo/utils";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import type { FinanceOperation } from "@/hooks/use-landlord-finances";

import FinanceDrawer from "./FinanceDrawer";

const EXPENSE_CATEGORY_OPTIONS = budgetCategoryOptions("expense");

interface ExpenseEditorDrawerProps {
  /** Report month the editor was opened from (seeds the date). */
  month: string;
  /** The owner's properties; create picks one, edit keeps the saved one. */
  properties: FinanceProperty[];
  /** Applied property filter, seeding create drafts. */
  apartmentId: string | null;
  /** An existing row turns this into the edit-and-delete dialog. */
  initial?: ExpenseRecord;
  saving: FinanceOperation;
  /** Deletes are their own web operation (mobile shares one busy flag). */
  removing: FinanceOperation;
  /** Shared hook wrapper returning false on failure so this draft survives. */
  onSave: (draft: ExpenseDraft, editing: boolean) => Promise<boolean>;
  /** Absent on create-only editors where there is nothing to delete. */
  onDelete?: (id: string) => Promise<boolean>;
  onClose: () => void;
}

/**
 * The one expense form, mirroring mobile's ExpenseEntrySheet: create and edit
 * share everything except that editing locks the property and enables the
 * two-step delete. Validation, date bounds and messages come from the shared
 * @repo/utils rules; failures keep the drawer and its draft, and delete closes
 * quietly like mobile.
 */
export default function ExpenseEditorDrawer({
  month,
  properties,
  apartmentId,
  initial,
  saving,
  removing,
  onSave,
  onDelete,
  onClose,
}: ExpenseEditorDrawerProps) {
  const today = manilaToday();
  const busy = saving.pending || removing.pending;
  const [property, setProperty] = useState(
    initial?.apartment_id ?? apartmentId ?? properties[0]?.id ?? "",
  );
  const [category, setCategory] = useState(initial?.category ?? "maintenance");
  const [treatment, setTreatment] = useState<ExpenseTreatment>(
    initial?.treatment ??
      financeCategoryTreatmentDefault(initial?.category ?? "maintenance"),
  );
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [date, setDate] = useState(
    initial?.spent_on ?? financeExpenseDateDefault(month, today),
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const parsedAmount = parseFinanceAmount(amount);
  const dateError = validateExpenseDate(date, today);
  const propertyError = properties.some((item) => item.id === property)
    ? null
    : "Choose one of your properties.";
  const categoryError = EXPENSE_CATEGORY_OPTIONS.some(
    (item) => item.id === category,
  )
    ? null
    : "Choose an expense category.";
  const treatmentError =
    treatment === "operating" || treatment === "capital"
      ? null
      : "Choose an expense treatment.";
  const descriptionError = !description.trim()
    ? "Describe this expense."
    : description.trim().length > MAX_FINANCE_DESCRIPTION_LENGTH
      ? "Use 200 characters or fewer."
      : null;
  const amountError =
    submitted && parsedAmount === null
      ? "Enter a positive amount with at most two decimals."
      : null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    saving.clearError();
    removing.clearError();
    setSubmitted(true);
    if (
      !!propertyError ||
      !!categoryError ||
      !!treatmentError ||
      !!dateError ||
      parsedAmount === null ||
      !!descriptionError
    ) {
      // First invalid input gets focus; selects announce through their alerts.
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            "#finance-expense-form [aria-invalid='true'] input, #finance-expense-form input[aria-invalid='true']",
          )
          ?.focus(),
      );
      return;
    }
    const ok = await onSave(
      {
        // Create reuses this UUID on a retry of an uncertain insert; editing
        // keeps the saved id, mirroring mobile's expo-crypto UUID.
        id: initial?.id ?? crypto.randomUUID(),
        apartment_id: property,
        category,
        treatment,
        amount: parsedAmount,
        spent_on: date,
        description: description.trim(),
      },
      !!initial,
    );
    if (ok) {
      toast.success("Expense saved");
      onClose();
    }
  };

  const destroy = async () => {
    if (!initial || !onDelete) return;
    const ok = await onDelete(initial.id);
    if (ok) onClose();
  };

  return (
    <FinanceDrawer
      title={initial ? "Edit expense" : "Add expense"}
      description="Record money already spent. Reserve allocations and late rent are not expenses."
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
            form="finance-expense-form"
            type="submit"
            className="flex-1"
            isPending={busy}
            isDisabled={busy}
          >
            {busy ? "Saving…" : "Save expense"}
          </Button>
        </div>
      }
    >
      <Form
        id="finance-expense-form"
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
            isDisabled={busy || !!initial}
            onChange={setProperty}
          />
          {submitted && !!propertyError ? (
            <p role="alert" className="text-sm text-destructive">
              {propertyError}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
          <SettingsSelect
            label="Category"
            className="w-full"
            value={category}
            options={EXPENSE_CATEGORY_OPTIONS.map((item) => ({
              value: item.id,
              label: item.label,
            }))}
            isDisabled={busy}
            onChange={(value) => {
              const next = value as typeof category;
              setCategory(next);
              // New categories reset to their treatment default, like mobile.
              setTreatment(financeCategoryTreatmentDefault(next));
            }}
          />
          {submitted && !!categoryError ? (
            <p role="alert" className="text-sm text-destructive">
              {categoryError}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>
            Expense treatment <span className="text-destructive">*</span>
          </Label>
          <SettingsSelect
            label="Expense treatment"
            className="w-full"
            value={treatment}
            options={[
              { value: "operating", label: "Operating expense" },
              {
                value: "capital",
                label: "Property improvement / replacement",
              },
            ]}
            isDisabled={busy}
            onChange={(value) => setTreatment(value as ExpenseTreatment)}
          />
          <p className="text-xs text-muted-foreground">
            Improvements and replacements are tracked separately from operating
            income. This is a cash-planning tool, not a tax calculation.
          </p>
          {submitted && !!treatmentError ? (
            <p role="alert" className="text-sm text-destructive">
              {treatmentError}
            </p>
          ) : null}
        </div>
        <TextField
          isRequired
          isInvalid={!!amountError}
          isDisabled={busy}
          value={amount === "." ? "." : formatPesoDisplay(amount)}
          onChange={(value) => setAmount(handlePesoChange(value).raw)}
        >
          <Label>Amount (₱)</Label>
          <Input inputMode="decimal" maxLength={20} placeholder="₱ 0" />
          <FieldError>{amountError}</FieldError>
        </TextField>
        {/* A native date input inside HeroUI's TextField never receives the
            generated label-for/id pair, so the label is associated directly
            with its real control (visits share this pattern; the paired ids
            keep the announced name and the tests' label lookup honest). */}
        <div className="space-y-2">
          <label
            htmlFor="finance-expense-date"
            className="block font-medium text-sm"
          >
            Date paid <span className="text-destructive">*</span>
          </label>
          <input
            id="finance-expense-date"
            name="finance-expense-date"
            type="date"
            disabled={busy}
            aria-invalid={submitted && !!dateError ? true : undefined}
            value={date}
            min="2000-01-01"
            max={today}
            onChange={(event) => setDate(event.target.value)}
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
          />
          {submitted && dateError ? (
            <p role="alert" className="text-sm text-destructive">
              {dateError}
            </p>
          ) : null}
        </div>
        <TextField
          isRequired
          isInvalid={submitted && !!descriptionError}
          isDisabled={busy}
          value={description}
          onChange={setDescription}
          maxLength={MAX_FINANCE_DESCRIPTION_LENGTH}
        >
          <Label>Description</Label>
          <Input placeholder="e.g. Kitchen sink repair" />
          <FieldError>{submitted ? descriptionError : null}</FieldError>
        </TextField>
        {saving.error || removing.error ? (
          <p role="alert" className="text-sm text-destructive">
            {saving.error ?? removing.error}
          </p>
        ) : null}
      </Form>
      {initial ? (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          {confirmDelete ? (
            <p className="text-sm text-destructive">
              Delete this expense? This cannot be undone and the month will
              need reviewing again.
            </p>
          ) : null}
          <Button
            variant="danger-soft"
            isDisabled={busy}
            onPress={() =>
              confirmDelete ? void destroy() : setConfirmDelete(true)
            }
          >
            <IconTrash size={16} aria-hidden />
            {confirmDelete ? "Confirm delete" : "Delete expense"}
          </Button>
        </div>
      ) : null}
    </FinanceDrawer>
  );
}
