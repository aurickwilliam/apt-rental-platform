import { useCallback, useState } from "react";
import { Keyboard, Text, View } from "react-native";
import { BottomSheet, Button } from "heroui-native";
import {
  BottomSheetFooter,
  BottomSheetScrollView,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatPesoDisplay,
  handlePesoChange,
  parseFinanceAmount,
  suggestFinanceBudget,
  type BudgetKind,
  type FinanceCategory,
} from "@repo/utils";
import SheetInput, { MAX_FORMATTED_AMOUNT_LENGTH } from "./SheetInput";

/** Mirrors the database's `landlord_budgets.months_remaining` check. */
const MAX_GOAL_MONTHS = 600;

export interface BudgetGoalDraft {
  /** Raw peso draft; an empty value means the plan has no goal. */
  target: string;
  /** Raw month draft. */
  months: string;
}

interface BudgetGoalSheetProps {
  isOpen: boolean;
  category: FinanceCategory;
  kind: BudgetKind;
  /** The plan's saved goal; every opening reseeds the draft from it. */
  goal: BudgetGoalDraft;
  /** Applies the goal with its calculated monthly amount. */
  onApply: (goal: BudgetGoalDraft, suggestedAmount: number) => void;
  onClose: () => void;
}

/**
 * The goal calculator behind "Calculate from a goal". It only stages a draft:
 * nothing reaches the budget form until the landlord picks the suggestion, so
 * the monthly allocation stays their decision.
 */
export default function BudgetGoalSheet({
  isOpen,
  category,
  kind,
  goal,
  onApply,
  onClose,
}: BudgetGoalSheetProps) {
  const insets = useSafeAreaInsets();
  const [target, setTarget] = useState(goal.target);
  const [months, setMonths] = useState(goal.months);
  const [wasOpen, setWasOpen] = useState(isOpen);
  // The sheet stays mounted while closed (HeroUI snaps it open on a closed →
  // open transition), so each opening reseeds the draft.
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setTarget(goal.target);
      setMonths(goal.months);
    }
  }
  const hasGoal = target.trim().length > 0;
  const targetValue = hasGoal ? parseFinanceAmount(target) : null;
  const monthsValue = /^\d+$/.test(months) ? Number(months) : 0;
  const monthsValid = monthsValue >= 1 && monthsValue <= MAX_GOAL_MONTHS;
  const suggestion =
    targetValue !== null && monthsValid
      ? suggestFinanceBudget({
          category,
          kind,
          target_amount: targetValue,
          months_remaining: monthsValue,
        })
      : null;
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  const apply = useCallback(() => {
    if (!suggestion) return;
    Keyboard.dismiss();
    onApply({ target, months }, suggestion.amount);
  }, [months, onApply, suggestion, target]);
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View className="px-5 py-3 border-t border-border bg-surface">
          <Button onPress={apply} isDisabled={!suggestion}>
            <Button.Label>Use suggested amount</Button.Label>
          </Button>
        </View>
      </BottomSheetFooter>
    ),
    [apply, insets.bottom, suggestion],
  );
  return (
    <BottomSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["80%"]}
          enableDynamicSizing={false}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
          enableBlurKeyboardOnGesture
          footerComponent={renderFooter}
        >
          <BottomSheetScrollView
            testID="budget-goal-sheet"
            keyboardShouldPersistTaps="handled"
            enableFooterMarginAdjustment
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="gap-4">
              <View className="gap-1">
                <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">
                  Calculate from a goal
                </BottomSheet.Title>
                <BottomSheet.Description className="font-inter text-sm text-muted">
                  Turn a target or a known bill into a monthly amount. It stays
                  a plan — no money is moved.
                </BottomSheet.Description>
              </View>
              <SheetInput
                label="Amount still needed or annual bill (₱)"
                value={target === "." ? "." : formatPesoDisplay(target)}
                onChange={(text) => setTarget(handlePesoChange(text).raw)}
                numeric
                maxLength={MAX_FORMATTED_AMOUNT_LENGTH}
                placeholder="e.g. 12000"
                error={
                  hasGoal && targetValue === null
                    ? "Enter a positive amount with at most two decimals."
                    : undefined
                }
              />
              <SheetInput
                label="Months to spread this amount over"
                value={months}
                onChange={setMonths}
                numeric
                maxLength={3}
                error={
                  hasGoal && !monthsValid
                    ? `Enter a whole number from 1 to ${MAX_GOAL_MONTHS}.`
                    : undefined
                }
              />
              {suggestion ? (
                <View className="bg-surface-secondary rounded-2xl p-3 gap-2">
                  <Text className="font-nunitoBold text-sm text-accent">
                    Suggested: {formatPesoDisplay(suggestion.amount)} / month
                  </Text>
                  <Text className="font-inter text-xs text-muted">
                    {suggestion.basis}
                  </Text>
                </View>
              ) : (
                <Text className="font-inter text-sm text-muted">
                  Enter the amount and the months to see a suggested monthly
                  allocation.
                </Text>
              )}
            </View>
          </BottomSheetScrollView>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
