import { useState } from "react";
import { Keyboard, Text, View } from "react-native";
import {
  BottomSheet,
  Button,
  FieldError,
  Input,
  Label,
  TextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { randomUUID } from "expo-crypto";
import { IconTrash } from "@tabler/icons-react-native";
import {
  FINANCE_CATEGORIES,
  budgetCategoryOptions,
  financeMonthLabel,
  formatPesoDisplay,
  handlePesoChange,
  isBudgetCategoryAllowed,
  manilaToday,
  parseFinanceAmount,
  suggestFinanceBudget,
  validateExpenseDate,
  type BudgetKind,
  type ExpenseTreatment,
  type FinanceBudget,
  type FinanceCategory,
} from "@repo/utils";
import { FinanceSelect } from "./FinanceControls";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DateField from "@/components/inputs/DateField";
import { useColors } from "@/hooks/useTheme";
import {
  financeErrorMessage,
  type ExpenseDraft,
  type ExpenseRecord,
  type FinanceProperty,
} from "@/service/finance/financeService";

const MAX_FORMATTED_AMOUNT_LENGTH = "₱ 999,999,999.99".length;
const EXPENSE_CATEGORY_OPTIONS = FINANCE_CATEGORIES.filter(
  (item) => !["emergency", "vacancy"].includes(item.id),
);
const MAX_EXPENSE_DESCRIPTION_LENGTH = 200;

function SheetInput({
  label,
  value,
  onChange,
  error,
  numeric = false,
  maxLength = 200,
  placeholder,
  disabled = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  numeric?: boolean;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const handlers = useBottomSheetAwareHandlers();
  const { colors } = useColors();
  return (
    <TextField isInvalid={!!error} isDisabled={disabled} isRequired={required}>
      <Label>
        <Label.Text
          className={`font-nunitoSemiBold text-base ${error ? "text-danger" : "text-foreground"}`}
        >
          {label}
        </Label.Text>
      </Label>
      <Input
        isInvalid={!!error}
        className={`font-inter text-sm text-foreground${error ? " finance-field-invalid" : ""}`}
        style={
          error ? { borderColor: colors.danger, borderWidth: 2 } : undefined
        }
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        placeholder={placeholder}
        keyboardType={numeric ? "decimal-pad" : "default"}
        maxLength={maxLength}
        {...handlers}
      />
      <FieldError>{error}</FieldError>
    </TextField>
  );
}

interface CommonProps {
  /** HeroUI snaps a sheet open on a closed → open transition, so callers keep the sheet mounted. */
  isOpen: boolean;
  properties: FinanceProperty[];
  apartmentId: string | null;
  month: string;
  onClose: () => void;
}

interface ExpenseEditorProps extends CommonProps {
  initial?: ExpenseRecord;
  category?: FinanceCategory | null;
  onSave: (draft: ExpenseDraft, editing: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  presentation?: "sheet" | "page";
}

export function ExpenseEntrySheet(
  props: Omit<ExpenseEditorProps, "presentation">,
) {
  return <ExpenseEditor {...props} presentation="sheet" />;
}

export function ExpenseEntryPage(
  props: Omit<
    ExpenseEditorProps,
    "presentation" | "isOpen" | "initial" | "onDelete"
  >,
) {
  return <ExpenseEditor {...props} isOpen presentation="page" />;
}

function ExpenseEditor({
  isOpen,
  properties,
  apartmentId,
  month,
  initial,
  category: initialCategory,
  onClose,
  onSave,
  onDelete,
  presentation,
}: ExpenseEditorProps) {
  const seedCategory = initial?.category ?? initialCategory ?? "maintenance";
  const seedTreatment =
    initial?.treatment ??
    (seedCategory === "furniture" || seedCategory === "turnover"
      ? "capital"
      : "operating");
  const seedDate =
    initial?.spent_on ??
    (month === manilaToday().slice(0, 7) ? manilaToday() : `${month}-01`);
  const [id, setId] = useState(() => initial?.id ?? randomUUID());
  const [property, setProperty] = useState(
    initial?.apartment_id ?? apartmentId ?? properties[0]?.id ?? "",
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
  // The sheet stays mounted while closed, so every opening reseeds a fresh draft.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setId(initial?.id ?? randomUUID());
      setProperty(
        initial?.apartment_id ?? apartmentId ?? properties[0]?.id ?? "",
      );
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
  const form = (
    <View className="gap-4">
      {presentation === "sheet" && (
        <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">
          {initial ? "Edit expense" : "Add expense"}
        </BottomSheet.Title>
      )}
      <Text className="font-inter text-sm text-muted">
        Record money already spent. Reserve allocations and late rent are not
        expenses.
      </Text>
      <FinanceSelect
        label="Property"
        required
        error={submitted ? propertyError : undefined}
        searchable={presentation === "page"}
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
          {
            value: "capital",
            label: "Property improvement / replacement",
          },
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
      {presentation === "sheet" && (
        <>
          <Button onPress={handleSave} isDisabled={busy}>
            <Button.Label>{busy ? "Saving…" : "Save expense"}</Button.Label>
          </Button>
          <Button variant="secondary" onPress={onClose} isDisabled={busy}>
            <Button.Label>Cancel</Button.Label>
          </Button>
        </>
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
  if (presentation === "page")
    return (
      <ScreenWrapper
        header={<StandardHeader title="Add expense" onBackPress={close} />}
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
  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      {/* No full-window overlay: on iOS that layer draws above native modals,
          hiding the picker DateField opens as a React Native Modal. */}
      <BottomSheet.Portal disableFullWindowOverlay>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["90%"]}
          enableDynamicSizing={false}
          enablePanDownToClose={!busy}
        >
          <BottomSheetScrollView
            testID="expense-sheet-scroll"
            keyboardShouldPersistTaps="handled"
            // HeroUI's sheet container already pads every edge by 20px; only
            // add vertical breathing room so this matches the browse filters.
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {form}
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

interface BudgetEntryPageProps {
  properties: FinanceProperty[];
  apartmentId: string | null;
  month: string;
  initial?: FinanceBudget;
  presetCategory?: FinanceCategory;
  presetKind?: BudgetKind;
  /** Amount to start the form with, e.g. a suggestion the landlord chose to review. */
  suggestedAmount?: number;
  onClose: () => void;
  onSave: (budget: Omit<FinanceBudget, "id">) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

/** Planning and editing are both full pages, sharing this form. */
export function BudgetEntryPage({
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
}: BudgetEntryPageProps) {
  const { colors } = useColors();
  const seedProperty =
    initial?.apartment_id ?? apartmentId ?? properties[0]?.id ?? "";
  const seedKind = initial?.kind ?? presetKind ?? "expense";
  const seedCategory =
    initial?.category ??
    (presetCategory && isBudgetCategoryAllowed(seedKind, presetCategory)
      ? presetCategory
      : "maintenance");
  const seedMonths =
    initial?.months_remaining ??
    (seedCategory === "insurance" || seedCategory === "taxes" ? 12 : 6);
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
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const amountValue = parseFinanceAmount(amount, true);
  const targetValue = target.trim() ? parseFinanceAmount(target) : null;
  const monthsValue = /^\d+$/.test(months) ? Number(months) : 0;
  const validGoal =
    !target.trim() ||
    (targetValue !== null && monthsValue >= 1 && monthsValue <= 600);
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
  const suggestion = suggestFinanceBudget({
    category,
    kind,
    target_amount: targetValue,
    months_remaining: monthsValue,
  });
  const handleSave = async () => {
    if (busy) return;
    setSubmitted(true);
    if (
      amountValue === null ||
      !validGoal ||
      propertyError ||
      kindError ||
      categoryError
    )
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
        target_amount: targetValue,
        months_remaining: targetValue === null ? null : monthsValue,
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
  const form = (
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
      <View className="border-t border-border pt-4 gap-3">
        <Text className="font-nunitoSemiBold text-base text-foreground">
          Optional goal or known bill
        </Text>
        <SheetInput
          label="Amount still needed / annual bill (₱)"
          value={target === "." ? "." : formatPesoDisplay(target)}
          onChange={(text) => setTarget(handlePesoChange(text).raw)}
          numeric
          disabled={busy}
          maxLength={MAX_FORMATTED_AMOUNT_LENGTH}
          placeholder="e.g. 12000"
          error={
            submitted && target.trim() && targetValue === null
              ? "Enter a positive target amount."
              : undefined
          }
        />
        <SheetInput
          label="Months to spread this amount over"
          value={months}
          onChange={setMonths}
          numeric
          disabled={busy}
          maxLength={3}
          error={
            submitted &&
            !!target.trim() &&
            !(monthsValue >= 1 && monthsValue <= 600)
              ? "Enter a whole number from 1 to 600."
              : undefined
          }
        />
        {suggestion && (
          <View className="bg-surface-secondary rounded-2xl p-3 gap-2">
            <Text className="font-nunitoBold text-sm text-accent">
              Suggested: {formatPesoDisplay(suggestion.amount)} / month
            </Text>
            <Text className="font-inter text-xs text-muted">
              {suggestion.basis}
            </Text>
            <Button
              size="sm"
              variant="secondary"
              isDisabled={busy}
              onPress={() => setAmount(String(suggestion.amount))}
            >
              <Button.Label>Use suggestion</Button.Label>
            </Button>
          </View>
        )}
      </View>
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
  );
  return (
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
      {form}
    </ScreenWrapper>
  );
}
