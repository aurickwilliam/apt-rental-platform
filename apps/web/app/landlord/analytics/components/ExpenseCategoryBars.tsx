import { Button } from "@heroui/react";
import { IconReceipt2 } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  formatPesoDisplay,
  type FinanceData,
} from "@repo/utils";

interface ExpenseCategoryBarsProps {
  categories: FinanceData["categories"];
  onSelect: (category: FinanceData["categories"][number]["category"]) => void;
}

/**
 * "Where expenses go" — same rows as the mobile chart: categories with
 * recorded or previous spending, tallest first. Bars show amounts; the
 * previous-period figure is text, never color-only.
 */
export default function ExpenseCategoryBars({
  categories,
  onSelect,
}: ExpenseCategoryBarsProps) {
  const rows = [...categories]
    .filter((row) => (row.amount ?? 0) > 0 || row.previous_amount > 0)
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  const total = rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const max = Math.max(1, ...rows.map((row) => row.amount ?? 0));
  return (
    <section
      className="space-y-4 rounded-xl border border-border bg-card p-4"
      aria-label="Where expenses go"
    >
      <div>
        <h2 className="font-nunito text-lg font-bold">Where expenses go</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a category to see its transactions. Bars represent recorded
          spending, including improvements.
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <IconReceipt2
            size={32}
            className="text-muted-foreground"
            aria-hidden
          />
          <h3 className="font-nunito font-bold">No expenses recorded</h3>
          <p className="text-sm text-muted-foreground">
            Nothing recorded this month or the previous month.
          </p>
        </div>
      ) : null}
      {rows.map((row) => {
        const amount = row.amount ?? 0;
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        return (
          <Button
            key={row.category}
            className="finance-property"
            variant="ghost"
            aria-label={`${financeCategoryLabel(row.category)}, ${formatPesoDisplay(amount)}, ${percentage.toFixed(0)} percent, previous period ${formatPesoDisplay(row.previous_amount)}. Opens this category's transactions.`}
            onPress={() => onSelect(row.category)}
          >
            <div className="w-full space-y-2 text-left">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 whitespace-normal font-nunito text-sm font-semibold">
                  {financeCategoryLabel(row.category)}
                </span>
                <span className="whitespace-nowrap font-nunito text-sm font-bold text-brand">
                  {formatPesoDisplay(amount)}
                </span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${(amount / max) * 100}%` }}
                />
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 flex-1 whitespace-nowrap text-xs text-muted-foreground">
                  Previous comparable period:{" "}
                  {formatPesoDisplay(row.previous_amount)}
                </span>
                <span className="whitespace-nowrap font-nunito text-xs font-bold text-brand">
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          </Button>
        );
      })}
    </section>
  );
}
