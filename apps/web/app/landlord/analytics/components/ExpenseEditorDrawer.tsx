"use client";

import { useState } from "react";
import { parseDate } from "@internationalized/date";
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
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
  type FinanceCategory,
  type FinanceProperty,
} from "@repo/utils";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import type { FinanceOperation } from "@/hooks/use-landlord-finances";

import FinanceDrawer from "./FinanceDrawer";

const EXPENSE_CATEGORY_OPTIONS = budgetCategoryOptions("expense");
/** Matches the shared rule: expenses can be dated from 2000 onwards. */
const MIN_EXPENSE_DATE = "2000-01-01";

/** The draft is kept as an ISO string; only a real calendar date reaches the picker. */
function toCalendarDate(value: string) {
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

interface ExpenseEditorDrawerProps {
  /** Report month the editor was opened from (seeds the date). */
  month: string;
  /** The owner's properties; create picks one, edit keeps the saved one. */
  properties: FinanceProperty[];
  /** Applied property filter, seeding create drafts. */
  apartmentId: string | null;
  /** An existing row turns this into the edit-and-delete dialog. */
  initial?: ExpenseRecord;
  /** Seeds a new expense's category, e.g. from a category page. */
  category?: FinanceCategory | null;
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
  category: presetCategory,
  saving,
  removing,
  onSave,
  onDelete,
  onClose,
}: ExpenseEditorDrawerProps) {
  const today = manilaToday();
  const busy = saving.pending || removing.pending;
  // A new expense starts without a property unless the report is scoped to one.
  const [property, setProperty] = useState(
    initial?.apartment_id ?? apartmentId ?? "",
  );
  const [category, setCategory] = useState(
    initial?.category ?? presetCategory ?? "maintenance",
  );
  const [treatment, setTreatment] = useState<ExpenseTreatment>(
    initial?.treatment ??
      financeCategoryTreatmentDefault(
        initial?.category ?? presetCategory ?? "maintenance",
      ),
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
  const parsedDate = toCalendarDate(date);
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
        <div className="flex flex-col gap-1">
          <Label
            className={`label--required ${submitted && !!propertyError ? "label--invalid" : ""}`}
          >
            Property
          </Label>
          <SettingsSelect
            label="Property"
            className="w-full"
            placeholder="Select a property"
            isInvalid={submitted && !!propertyError}
            value={property}
            options={properties.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            isDisabled={busy || !!initial}
            onChange={setProperty}
          />
          {submitted && !!propertyError ? (
            <p role="alert" className="px-1 text-xs text-destructive">
              {propertyError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <Label className="label--required">Category</Label>
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
            <p role="alert" className="px-1 text-xs text-destructive">
              {categoryError}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <Label className="label--required">Expense treatment</Label>
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
            <p role="alert" className="px-1 text-xs text-destructive">
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
        <DatePicker
          className="flex w-full flex-col gap-1"
          value={parsedDate}
          onChange={(value) => setDate(value ? value.toString() : "")}
          minValue={parseDate(MIN_EXPENSE_DATE)}
          maxValue={parseDate(today)}
          isInvalid={submitted && !!dateError}
          isDisabled={busy}
          isRequired
        >
          <Label>Date paid</Label>
          <DateField.Group fullWidth className="border border-border bg-card">
            <DateField.Input>
              {(segment) => (
                <DateField.Segment
                  segment={segment}
                  className="text-foreground data-[placeholder=true]:text-muted-foreground"
                />
              )}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger className="cursor-pointer">
                <DatePicker.TriggerIndicator className="text-muted-foreground" />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <FieldError>{dateError}</FieldError>
          <DatePicker.Popover>
            <Calendar aria-label="Date paid">
              <Calendar.Header>
                <Calendar.YearPickerTrigger className="cursor-pointer">
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator className="text-muted-foreground" />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton
                  slot="previous"
                  className="cursor-pointer text-muted-foreground"
                />
                <Calendar.NavButton
                  slot="next"
                  className="cursor-pointer text-muted-foreground"
                />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(day) => (
                    <Calendar.Cell
                      date={day}
                      className="cursor-pointer data-selected:bg-primary data-selected:text-white data-disabled:cursor-not-allowed"
                    />
                  )}
                </Calendar.GridBody>
              </Calendar.Grid>
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {(yearProps) => (
                    <Calendar.YearPickerCell
                      year={yearProps.year}
                      className="cursor-pointer data-selected:bg-primary data-selected:text-white"
                    />
                  )}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>
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
            className="w-full"
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
