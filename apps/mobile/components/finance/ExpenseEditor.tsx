import { Text, View } from "react-native";
import { Button } from "heroui-native";
import {
  formatPesoDisplay,
  handlePesoChange,
  manilaToday,
  type ExpenseTreatment,
  type FinanceCategory,
} from "@repo/utils";
import FinanceSelect from "./FinanceSelect";
import SheetInput, { MAX_FORMATTED_AMOUNT_LENGTH } from "./SheetInput";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DateField from "@/components/inputs/DateField";
import {
  useExpenseEntryForm,
  EXPENSE_CATEGORY_OPTIONS,
  MAX_EXPENSE_DESCRIPTION_LENGTH,
  type ExpenseEntryFormOptions,
} from "@/hooks/finance/useExpenseEntryForm";

/** The expense form page, for creating a new expense or editing a saved one. */
export default function ExpenseEditor(props: ExpenseEntryFormOptions) {
  const { properties, initial } = props;
  const {
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
  } = useExpenseEntryForm(props);

  const form = (
    <View className="gap-4">
      <Text className="font-inter text-sm text-muted">
        Record money already spent. Reserve allocations and late rent are not
        expenses.
      </Text>
      <FinanceSelect
        label="Property"
        required
        error={submitted ? propertyError : undefined}
        searchable
        value={property}
        options={properties.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        onChange={setProperty}
        disabled={busy || !!initial}
      />
      <FinanceSelect
        label="Category"
        required
        error={submitted ? categoryError : undefined}
        highlightSelection
        value={category}
        options={EXPENSE_CATEGORY_OPTIONS.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        disabled={busy}
        onChange={(value) => {
          setCategory(value as FinanceCategory);
          setTreatment(
            value === "furniture" || value === "turnover"
              ? "capital"
              : "operating",
          );
        }}
      />
      <FinanceSelect
        label="Expense treatment"
        required
        error={submitted ? treatmentError : undefined}
        sheetHeight="50%"
        highlightSelection
        value={treatment}
        onChange={(value) => setTreatment(value as ExpenseTreatment)}
        disabled={busy}
        options={[
          { value: "operating", label: "Operating expense" },
          { value: "capital", label: "Property improvement / replacement" },
        ]}
      />
      <Text className="font-inter text-xs text-muted">
        Improvements and replacements are tracked separately from operating
        income. This is a cash-planning tool, not a tax calculation.
      </Text>
      <SheetInput
        label="Amount (₱)"
        required
        value={amount === "." ? "." : formatPesoDisplay(amount)}
        onChange={(text) => setAmount(handlePesoChange(text).raw)}
        numeric
        disabled={busy}
        placeholder="0.00"
        maxLength={MAX_FORMATTED_AMOUNT_LENGTH}
        error={
          submitted && amountValue === null
            ? "Enter a positive amount with at most two decimals."
            : undefined
        }
      />
      <DateField
        label="Date paid"
        required
        value={new Date(`${date}T12:00:00`)}
        onChange={(selected) =>
          setDate(
            `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`,
          )
        }
        maximumDate={new Date(`${manilaToday()}T12:00:00`)}
        disabled={busy}
        error={submitted ? (dateError ?? undefined) : undefined}
      />
      <SheetInput
        label="Description"
        required
        maxLength={MAX_EXPENSE_DESCRIPTION_LENGTH}
        value={description}
        onChange={setDescription}
        disabled={busy}
        placeholder="e.g. Kitchen sink repair"
        error={submitted ? descriptionError : undefined}
      />
      {error && (
        <Text
          accessibilityRole="alert"
          selectable
          className="text-danger text-sm font-inter"
        >
          {error}
        </Text>
      )}
      {initial && (
        <View className="gap-2 border-t border-border pt-4">
          {confirmDelete && (
            <Text className="font-inter text-sm text-danger">
              Delete this expense? This cannot be undone and the month will need
              reviewing again.
            </Text>
          )}
          <Button
            variant="danger-soft"
            isDisabled={busy}
            onPress={() =>
              confirmDelete ? void handleDelete() : setConfirmDelete(true)
            }
          >
            <Button.Label>
              {confirmDelete ? "Confirm delete" : "Delete expense"}
            </Button.Label>
          </Button>
        </View>
      )}
    </View>
  );
  return (
    <ScreenWrapper
      header={
        <StandardHeader
          title={initial ? "Edit expense" : "Add expense"}
          onBackPress={close}
        />
      }
      scrollable
      className="p-5"
      footer={
        <View className="px-5 py-3 border-t border-border bg-background flex-row gap-3">
          <Button
            className="flex-1"
            variant="tertiary"
            onPress={close}
            isDisabled={busy}
          >
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleSave} isDisabled={busy}>
            <Button.Label>{busy ? "Saving…" : "Save expense"}</Button.Label>
          </Button>
        </View>
      }
    >
      {form}
    </ScreenWrapper>
  );
}
