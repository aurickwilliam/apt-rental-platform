"use client";

import { Button } from "@heroui/react";
import FinanceMeter from "./FinanceMeter";
import {
  budgetProgress,
  formatPesoDisplay,
  type FinanceCategory,
} from "@repo/utils";

interface BudgetProgressRowProps {
  /** Category label, or a property name in the drill-down. */
  title: string;
  /** Scope line: property count, property name, or "spent this month". */
  caption: string;
  /** The plan's limit (or planned allocation). */
  amount: number;
  /** Recorded spending against that limit. */
  spent: number;
  /** What pressing the row does, e.g. "View properties" or "Edit budget". */
  action: string;
  onPress: () => void;
  /** Tints the row with the category's soft fill, like mobile's budget rows. */
  category?: FinanceCategory;
}

/**
 * One budget-versus-actual row, mirroring mobile's BudgetProgressRow: the
 * Budget tab shows a category's totals and the drill-down shows one property,
 * so both read the same shared arithmetic.
 */
export default function BudgetProgressRow({
  title,
  caption,
  amount,
  spent,
  action,
  onPress,
  category,
}: BudgetProgressRowProps) {
  const { over, percent, difference, barWidth } = budgetProgress(amount, spent);
  return (
    <Button
      variant="ghost"
      className={
        category
          ? "finance-category-row items-stretch text-left"
          : "h-auto w-full items-stretch whitespace-normal py-2 text-left"
      }
      data-finance-category={category}
      aria-label={`${title}, ${caption}. Spent ${formatPesoDisplay(spent)} of ${formatPesoDisplay(amount)}. ${over ? "Over budget" : "Within budget"}. ${action}`}
      onPress={onPress}
    >
      <div className="w-full space-y-2 text-left">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 flex-1 font-nunito text-base font-semibold">
            {title}
          </p>
          <p className="shrink-0 text-sm text-muted-foreground">{caption}</p>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-nunito text-base font-bold tabular-nums">
            {formatPesoDisplay(spent)} / {formatPesoDisplay(amount)}
          </p>
          {percent !== null ? (
            <p
              className={`text-sm ${over ? "text-destructive" : "text-muted-foreground"}`}
            >
              {percent}% used
            </p>
          ) : null}
        </div>
        <FinanceMeter
          label={`${title} spending used`}
          value={barWidth}
          over={over}
        />
        <p
          className={`text-sm ${over ? "text-destructive" : "text-muted-foreground"}`}
        >
          {formatPesoDisplay(difference)} {over ? "over budget" : "remaining"}
        </p>
      </div>
    </Button>
  );
}
