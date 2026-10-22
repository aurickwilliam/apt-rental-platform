import { Button } from "@heroui/react";
import { financeCategoryLabel, formatPesoDisplay } from "@repo/utils";
import type { ExpenseRecord } from "@repo/utils";

/**
 * One transaction in a drill-down list, mirroring mobile's
 * ExpenseTransactionRow: description and amount, paid date and category,
 * then property and treatment. Selecting it opens the editor.
 */
export default function ExpenseTransactionRow({
  expense,
  propertyName,
  onPress,
}: {
  expense: ExpenseRecord;
  propertyName?: string;
  onPress: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <Button
        className="finance-property"
        variant="ghost"
        aria-label={`Edit ${expense.description}, ${formatPesoDisplay(expense.amount)}, paid ${expense.spent_on}`}
        onPress={onPress}
      >
        <div className="w-full space-y-1 text-left">
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 flex-1 whitespace-normal font-nunito text-sm font-semibold">
              {expense.description}
            </span>
            <span className="whitespace-nowrap font-nunito text-sm font-bold text-brand">
              {formatPesoDisplay(expense.amount)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {expense.spent_on} · {financeCategoryLabel(expense.category)}
          </p>
          <p className="text-xs text-muted-foreground">
            {propertyName ? `${propertyName} · ` : ""}
            {expense.treatment === "capital"
              ? "Improvement / replacement"
              : "Operating"}
          </p>
        </div>
      </Button>
    </div>
  );
}
