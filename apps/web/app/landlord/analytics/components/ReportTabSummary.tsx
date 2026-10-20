"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import {
  financeCategoryLabel,
  financeMonthLabel,
  groupBudgetsByCategory,
  suggestFinanceBudget,
  type FinanceData,
  type FinanceScope,
} from "@repo/utils";
import type { FinanceOperation } from "@/hooks/use-landlord-finances";
import FinanceCard from "./FinanceCard";
import FinanceModal from "./FinanceModal";
import FinanceMoneyRow from "./FinanceMoneyRow";

interface ReportTabSummaryProps {
  tab: "expenses" | "budget";
  data: FinanceData;
  scope: FinanceScope;
  onReserve: () => void;
  onReview: () => Promise<boolean>;
  reviewing: FinanceOperation;
}

/** Readable report context for the Overview's destination tabs. Transaction
 * editors and grouped-plan drill-downs are added in their dedicated phases. */
export default function ReportTabSummary({
  tab,
  data,
  scope,
  onReserve,
  onReview,
  reviewing,
}: ReportTabSummaryProps) {
  const [confirming, setConfirming] = useState(false);
  const active = data.months.at(-1)!;
  if (tab === "expenses")
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
          <FinanceMoneyRow
            label="Recorded operating expenses"
            amount={active.operating}
          />
          <FinanceMoneyRow
            label="Improvements / replacements paid"
            amount={active.capital}
          />
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
        <FinanceCard title="Where expenses go">
          {data.categories
            .filter((item) => item.amount || item.previous_amount)
            .map((item) => (
              <FinanceMoneyRow
                key={item.category}
                label={financeCategoryLabel(item.category)}
                amount={item.amount ?? 0}
              />
            ))}
          {!data.categories.some(
            (item) => item.amount || item.previous_amount,
          ) ? (
            <p className="text-sm text-muted-foreground">
              No expenses recorded for this month.
            </p>
          ) : null}
        </FinanceCard>
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
                      toast.success("Expenses reviewed");
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
  const groups = groupBudgetsByCategory(data.budgets);
  return (
    <div className="space-y-4">
      {(
        [
          ["expense", "Budget versus actual"],
          ["reserve", "Planned reserves"],
        ] as const
      ).map(([kind, title]) => (
        <FinanceCard
          key={kind}
          title={title}
          description={
            kind === "reserve"
              ? "Planned amounts, not funded savings or money transferred."
              : "Recorded spending includes improvements."
          }
        >
          {groups
            .filter((group) => group.kind === kind)
            .map((group) => (
              <div
                key={group.category}
                className="space-y-2 border-b border-border pb-3"
              >
                <h3 className="font-nunito font-semibold">
                  {financeCategoryLabel(group.category)}
                </h3>
                <FinanceMoneyRow
                  label={
                    kind === "reserve" ? "Planned allocation" : "Spending limit"
                  }
                  amount={group.amount}
                />
                {kind === "expense" ? (
                  <>
                    <FinanceMoneyRow
                      label="Recorded spending"
                      amount={group.spent}
                    />
                    <p className="text-sm">
                      {
                        group.entries.filter(
                          (entry) => entry.spent > entry.amount,
                        ).length
                      }{" "}
                      property plan(s) over their limits
                    </p>
                  </>
                ) : null}
              </div>
            ))}
          {!groups.some((group) => group.kind === kind) ? (
            <p className="text-sm text-muted-foreground">
              {kind === "reserve"
                ? "No planned reserves this month."
                : "No spending limits this month."}
            </p>
          ) : null}
          {kind === "reserve" ? (
            <Button variant="secondary" onPress={onReserve}>
              Plan an emergency reserve
            </Button>
          ) : null}
        </FinanceCard>
      ))}
      <FinanceCard
        title="Budget suggestions"
        description="Based on your entries, never estimated market costs."
      >
        {data.budgets
          .filter((budget) => suggestFinanceBudget(budget))
          .map((budget) => {
            const suggestion = suggestFinanceBudget(budget)!;
            return (
              <div key={budget.id} className="space-y-2">
                <FinanceMoneyRow
                  label={suggestion.title}
                  amount={suggestion.amount}
                />
                <p className="text-xs text-muted-foreground">
                  {suggestion.basis}
                </p>
              </div>
            );
          })}
        {!data.budgets.some((budget) => suggestFinanceBudget(budget)) ? (
          <p className="text-sm text-muted-foreground">
            Add an entered goal to see a monthly suggestion.
          </p>
        ) : null}
      </FinanceCard>
    </div>
  );
}
