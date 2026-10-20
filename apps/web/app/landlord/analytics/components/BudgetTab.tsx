"use client";

import { Button } from "@heroui/react";
import {
  financeCategoryLabel,
  groupBudgetsByCategory,
  type FinanceData,
} from "@repo/utils";

import FinanceCard from "./FinanceCard";
import FinanceMoneyRow from "./FinanceMoneyRow";

interface BudgetTabProps {
  data: FinanceData;
  onReserve: () => void;
}

/**
 * Readable plan context for the Budget tab (Phase 3's placeholder, kept as
 * the Phase 4 base). The grouped progress chart, per-property drill-down and
 * plan editors are added with Phase 5, mirroring mobile's
 * BudgetProgressChart; this summary already uses the shared grouping rule.
 */
export default function BudgetTab({ data, onReserve }: BudgetTabProps) {
  const groups = groupBudgetsByCategory(data.budgets);
  const expenseGroups = groups.filter((group) => group.kind === "expense");
  const reserveGroups = groups.filter((group) => group.kind === "reserve");
  return (
    <div className="space-y-4">
      <FinanceCard
        title="Budget versus actual"
        description="Recorded spending includes improvements. Plans are limits, not money moved."
      >
        {expenseGroups.map((group) => (
          <div key={group.category} className="space-y-2">
            <h3 className="font-nunito font-semibold">
              {financeCategoryLabel(group.category)}
            </h3>
            <FinanceMoneyRow label="Spending limit" amount={group.amount} />
            <FinanceMoneyRow label="Recorded spending" amount={group.spent} />
            <p className="text-sm text-muted-foreground">
              {group.entries.length}{" "}
              {group.entries.length === 1 ? "property plan" : "property plans"}{" "}
              with a limit
            </p>
          </div>
        ))}
        {expenseGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No spending limits this month.
          </p>
        ) : null}
      </FinanceCard>
      <FinanceCard
        title="Planned reserves"
        description="Planned amounts, not funded savings or money transferred."
      >
        {reserveGroups.map((group) => (
          <div key={group.category} className="space-y-2">
            <h3 className="font-nunito font-semibold">
              {financeCategoryLabel(group.category)}
            </h3>
            <FinanceMoneyRow
              label="Planned allocation"
              amount={group.amount}
            />
            <p className="text-sm text-muted-foreground">
              {group.entries.length}{" "}
              {group.entries.length === 1 ? "property plan" : "property plans"}{" "}
              holding a reserve
            </p>
          </div>
        ))}
        {reserveGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No planned reserves this month.
          </p>
        ) : null}
        <Button variant="secondary" onPress={onReserve}>
          Plan an emergency reserve
        </Button>
      </FinanceCard>
    </div>
  );
}
