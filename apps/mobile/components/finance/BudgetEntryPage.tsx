import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconCalculator, IconTrash } from "@tabler/icons-react-native";
import {
  budgetCategoryOptions,
  financeMonthLabel,
  formatPesoDisplay,
  handlePesoChange,
  isBudgetCategoryAllowed,
  type BudgetKind,
  type FinanceCategory,
} from "@repo/utils";
import FinanceSelect from "./FinanceSelect";
import BudgetGoalSheet from "./BudgetGoalSheet";
import SheetInput, { MAX_FORMATTED_AMOUNT_LENGTH } from "./SheetInput";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import { useColors } from "@/hooks/useTheme";
import {
  useBudgetEntryForm,
  type BudgetEntryFormOptions,
} from "@/hooks/finance/useBudgetEntryForm";

/** Planning and editing are both full pages, sharing this form. */
export default function BudgetEntryPage(props: BudgetEntryFormOptions) {
  const { properties, month, initial, onDelete } = props;
  const { colors } = useColors();
  const {
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
  } = useBudgetEntryForm(props);

  return (
    <>
      <ScreenWrapper
        header={
          <StandardHeader
            title={initial ? "Edit budget" : "Plan a budget"}
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
              <Button.Label>{busy ? "Saving…" : "Save budget"}</Button.Label>
            </Button>
          </View>
        }
      >
        <View className="gap-4">
          <Text className="font-inter text-sm text-muted">
            {financeMonthLabel(month)} · Plans only. No money is moved or saved
            automatically.
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
            label="Plan type"
            required
            error={submitted ? kindError : undefined}
            sheetHeight="50%"
            highlightSelection
            value={kind}
            options={[
              { value: "expense", label: "Spending budget" },
              { value: "reserve", label: "Planned reserve" },
            ]}
            disabled={busy || !!initial}
            onChange={(value) => {
              setKind(value as BudgetKind);
              if (
                value === "expense" &&
                !isBudgetCategoryAllowed("expense", category)
              )
                setCategory("maintenance");
            }}
          />
          <FinanceSelect
            label="Category"
            required
            error={submitted ? categoryError : undefined}
            highlightSelection
            value={category}
            options={budgetCategoryOptions(kind).map((item) => ({
              value: item.id,
              label: item.label,
            }))}
            onChange={(value) => setCategory(value as FinanceCategory)}
            disabled={busy || !!initial}
          />
          <SheetInput
            label={
              kind === "expense"
                ? "Monthly spending limit (₱)"
                : "Planned allocation this month (₱)"
            }
            required
            value={amount === "." ? "." : formatPesoDisplay(amount)}
            onChange={(text) => setAmount(handlePesoChange(text).raw)}
            numeric
            disabled={busy}
            placeholder="0.00"
            maxLength={MAX_FORMATTED_AMOUNT_LENGTH}
            error={
              submitted && amountValue === null
                ? "Enter zero or a positive amount with at most two decimals."
                : undefined
            }
          />
          <Button
            variant="secondary"
            isDisabled={busy}
            onPress={() => setGoalSheetOpen(true)}
          >
            <IconCalculator size={18} color={colors.textPrimary} />
            <Button.Label>
              {goalSummary ? "Change goal" : "Calculate from a goal"}
            </Button.Label>
          </Button>
          {error && (
            <Text
              accessibilityRole="alert"
              selectable
              className="text-danger text-sm font-inter"
            >
              {error}
            </Text>
          )}
          {initial && onDelete && (
            <Button
              variant="danger-soft"
              isDisabled={busy}
              onPress={() =>
                confirmDelete ? void handleDelete() : setConfirmDelete(true)
              }
            >
              <IconTrash size={18} color={colors.danger} />
              <Button.Label>
                {confirmDelete ? "Confirm remove budget" : "Remove budget"}
              </Button.Label>
            </Button>
          )}
        </View>
      </ScreenWrapper>
      <BudgetGoalSheet
        isOpen={goalSheetOpen}
        category={category}
        kind={kind}
        goal={{ target, months }}
        onApply={applyGoal}
        onClose={() => setGoalSheetOpen(false)}
      />
    </>
  );
}
