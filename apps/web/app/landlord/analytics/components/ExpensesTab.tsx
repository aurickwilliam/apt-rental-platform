"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import {
  financeMonthLabel,
  type ExpenseRecord,
  type FinanceCategory,
  type FinanceData,
  type FinanceScope,
} from "@repo/utils";

import type {
  FinanceOperation,
  FinancePagesResult,
} from "@/hooks/use-landlord-finances";

import ExpenseCategoryBars from "./ExpenseCategoryBars";
import ExpenseTransactionsTable from "./ExpenseTransactionsTable";
import FinanceCard from "./FinanceCard";
import FinanceModal from "./FinanceModal";

interface ExpensesMainProps {
  data: FinanceData;
  scope: FinanceScope;
  expenses: FinancePagesResult<ExpenseRecord>;
  category: FinanceCategory | null;
  onCategoryChange: (category: FinanceCategory | null) => void;
  onEdit: (expense: ExpenseRecord) => void;
  onExport: () => void;
  onReview: () => Promise<boolean>;
  reviewing: FinanceOperation;
}

/**
 * Left column of the Expenses tab: the review card with its confirm dialog,
 * then the month's transactions. The category bars sit in the right column
 * and still open the category drill-down.
 */
export function ExpensesMain({
  data,
  scope,
  expenses,
  category,
  onCategoryChange,
  onEdit,
  onExport,
  onReview,
  reviewing,
}: ExpensesMainProps) {
  const [confirming, setConfirming] = useState(false);
  const active = data.months.at(-1)!;
  return (
    <>
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
      <ExpenseTransactionsTable
        scope={scope}
        properties={data.properties}
        expenses={expenses}
        category={category}
        onCategoryChange={onCategoryChange}
        onEdit={onEdit}
        onExport={onExport}
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
    </>
  );
}

/** Right column of the Expenses tab, under Needs attention. */
export function ExpensesAside({
  data,
  onSelectCategory,
}: {
  data: FinanceData;
  /** Opens the category transaction drill-down for this bar. */
  onSelectCategory: (category: FinanceCategory) => void;
}) {
  return (
    <ExpenseCategoryBars
      categories={data.categories}
      onSelect={onSelectCategory}
    />
  );
}
