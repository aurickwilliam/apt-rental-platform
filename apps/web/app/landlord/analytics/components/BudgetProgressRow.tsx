"use client";

import { Button } from "@heroui/react";
import { budgetProgress, formatPesoDisplay } from "@repo/utils";

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
}: BudgetProgressRowProps) {
  const { over, percent, difference, barWidth } = budgetProgress(amount, spent);
  return (
    <Button
      variant="ghost"
      className="h-auto w-full items-stretch whitespace-normal py-2 text-left"
      aria-label={`${title}, ${caption}. Spent ${formatPesoDisplay(spent)} of ${formatPesoDisplay(amount)}. ${over ? "Over budget" : "Within budget"}. ${action}`}
      onPress={onPress}
    >
      <div className="w-full space-y-2 text-left">
        <p className="font-nunito text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{caption}</p>
        <p className="font-nunito text-sm font-bold tabular-nums">
          {formatPesoDisplay(spent)} / {formatPesoDisplay(amount)}
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className={`h-full rounded-full ${over ? "bg-destructive" : "bg-brand"}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p
          className={`text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}
        >
          {formatPesoDisplay(difference)}{" "}
          {over
            ? `over budget${percent !== null ? ` · ${percent}% used` : ""}`
            : "remaining"}
        </p>
      </div>
    </Button>
  );
}
