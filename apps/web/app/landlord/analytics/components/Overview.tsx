"use client";

import dynamic from "next/dynamic";
import { Button } from "@heroui/react";
import {
  financePlanTotals,
  type CollectionStatus,
  type FinanceData,
} from "@repo/utils";
import FinanceCard from "./FinanceCard";
import FinanceMoneyRow, { financeMoney } from "./FinanceMoneyRow";
import CollectionHealth from "./CollectionHealth";
import PropertyPerformance from "./PropertyPerformance";

const IncomeTrends = dynamic(() => import("./IncomeTrends"), {
  loading: () => (
    <div
      className="h-96 animate-pulse rounded-xl bg-muted motion-reduce:animate-none"
      aria-label="Loading income trends"
    />
  ),
});

interface OverviewProps {
  data: FinanceData;
  onExpenses: (month?: string) => void;
  onBudgets: () => void;
  onReserve: () => void;
  onCollection: (status: CollectionStatus) => void;
  onProperty: (id: string) => void;
  onViewAll: () => void;
}

export default function Overview({
  data,
  onExpenses,
  onBudgets,
  onReserve,
  onCollection,
  onProperty,
  onViewAll,
}: OverviewProps) {
  const { spending, reserve, overLimit } = financePlanTotals(data.budgets);
  const active = data.months.at(-1)!;
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <FinanceCard title="Needs attention" className="finance-attention">
        {data.collections.overdue > 0 ? (
          <Button
            variant="secondary"
            className="finance-attention-action"
            onPress={() => onCollection("overdue")}
          >
            {financeMoney(data.collections.overdue)} overdue ·{" "}
            {data.collections.overdueCount} tenancies ›
          </Button>
        ) : (
          <p className="text-sm">No overdue balances for this rental month.</p>
        )}
        {!active.reviewed ? (
          <Button
            variant="secondary"
            className="finance-attention-action"
            onPress={() => onExpenses()}
          >
            Review expenses to see income
          </Button>
        ) : null}
        {overLimit ? (
          <Button
            variant="secondary"
            className="finance-attention-action"
            onPress={onBudgets}
          >
            Review budgets over their limits
          </Button>
        ) : null}
        {reserve === 0 ? (
          <Button
            variant="secondary"
            className="finance-attention-action"
            onPress={onReserve}
          >
            Plan an emergency reserve
          </Button>
        ) : null}
      </FinanceCard>
      <FinanceCard
        title="Your monthly plan"
        description="Spending limits and reserve allocations are kept separate."
      >
        {!data.budgets.length ? (
          <div className="py-4">
            <h3 className="font-nunito font-bold">
              No plan for this month yet
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Set spending limits and reserve goals for this month to see your
              plan here.
            </p>
          </div>
        ) : (
          <>
            <FinanceMoneyRow
              label="Planned spending limits"
              amount={spending}
            />
            <FinanceMoneyRow
              label="Planned reserve allocations"
              amount={reserve}
            />
          </>
        )}
        <Button variant="secondary" onPress={onBudgets}>
          View budgets & suggestions
        </Button>
      </FinanceCard>
      <div className="min-w-0 lg:col-span-2">
        <IncomeTrends months={data.months} onViewExpenses={onExpenses} />
      </div>
      <CollectionHealth data={data.collections} onSelect={onCollection} />
      <PropertyPerformance
        properties={data.performance}
        onSelect={onProperty}
        onViewAll={onViewAll}
      />
    </div>
  );
}
