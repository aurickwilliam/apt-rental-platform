"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import {
  financeMonthLabel,
  type FinanceCategory,
  type FinanceData,
  type FinanceScope,
} from "@repo/utils";

import type { FinanceOperation } from "@/hooks/use-landlord-finances";

import ExpenseCategoryBars from "./ExpenseCategoryBars";
import FinanceCard from "./FinanceCard";
import FinanceModal from "./FinanceModal";

interface ExpensesTabProps {
  data: FinanceData;
  scope: FinanceScope;
  /** Opens the category transaction drill-down for this bar. */
  onSelectCategory: (category: FinanceCategory) => void;
  onReview: () => Promise<boolean>;
  reviewing: FinanceOperation;
}

/**
 * Web mirror of mobile's Expenses tab: the review card with its confirm
 * dialog and the "Where expenses go" bars — the transactions themselves live
 * in the category drill-down route, exactly as on mobile.
 */
export default function ExpensesTab({
  data,
  scope,
  onSelectCategory,
  onReview,
  reviewing,
}: ExpensesTabProps) {
  const [confirming, setConfirming] = useState(false);
  const active = data.months.at(-1)!;
  return (
    <div className="space-y-4">
      <FinanceCard
        title={active.reviewed ? "Expenses reviewed" : "Review this month"}
        description={
          active.reviewed
            ? "Income uses your reviewed records. Adding, editing or deleting expenses reopens the review."
            : "Check every expense for the selected properties before confirming. Zero spending is valid only after review."
        }
      >
        {!active.reviewed ? (
          <Button
            onPress={() => {
              reviewing.clearError();
              setConfirming(true);
            }}
          >
            Mark expenses reviewed
          </Button>
        ) : null}
      </FinanceCard>
      <ExpenseCategoryBars
        categories={data.categories}
        onSelect={onSelectCategory}
      />
      {confirming ? (
        <FinanceModal
          title="Confirm expenses are complete"
          description={`I have entered all expenses paid in ${financeMonthLabel(scope.month)} for ${scope.apartmentId ? (data.properties.find((item) => item.id === scope.apartmentId)?.name ?? "this property") : "all my properties"}, including any zero-expense properties.`}
          onClose={() => setConfirming(false)}
          busy={reviewing.pending}
          footer={
            <div className="flex gap-3">
              <Button
                variant="tertiary"
                isDisabled={reviewing.pending}
                onPress={() => setConfirming(false)}
              >
                Keep reviewing
              </Button>
              <Button
                isPending={reviewing.pending}
                isDisabled={reviewing.pending}
                onPress={async () => {
                  if (await onReview()) {
                    setConfirming(false);
                    toast.success("Expenses reviewed", {
                      description:
                        "Operating income is now available for this month.",
                    });
                  }
                }}
              >
                {reviewing.pending ? "Confirming…" : "Confirm"}
              </Button>
            </div>
          }
        >
          {reviewing.error ? (
            <p role="alert" className="text-sm text-destructive">
              {reviewing.error}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Confirm only when your paid expenses are complete.
            </p>
          )}
        </FinanceModal>
      ) : null}
    </div>
  );
}
