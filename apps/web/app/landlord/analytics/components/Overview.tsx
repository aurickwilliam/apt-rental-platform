"use client";

import dynamic from "next/dynamic";
import { Button } from "@heroui/react";
import {
  financePlanTotals,
  type CollectionStatus,
  type FinanceData,
} from "@repo/utils";
import FinanceCard from "./FinanceCard";
import FinanceMoneyRow from "./FinanceMoneyRow";
import CollectionHealth from "./CollectionHealth";
import PropertyPerformance from "./PropertyPerformance";
import EmptyState from "@/app/components/display/EmptyState";
import { IconTargetArrow } from "@tabler/icons-react";

const IncomeTrends = dynamic(() => import("./IncomeTrends"), {
  loading: () => (
    <div
      className="h-96 animate-pulse rounded-3xl bg-muted motion-reduce:animate-none"
      aria-label="Loading income trends"
    />
  ),
});

interface OverviewMainProps {
  data: FinanceData;
  onExpenses: (month?: string) => void;
  onProperty: (id: string) => void;
  onViewAll: () => void;
}

/** Left column of the Overview tab: the income trend, then the properties. */
export function OverviewMain({
  data,
  onExpenses,
  onProperty,
  onViewAll,
}: OverviewMainProps) {
  return (
    <>
      <IncomeTrends months={data.months} onViewExpenses={onExpenses} />
      <PropertyPerformance
        properties={data.performance}
        onSelect={onProperty}
        onViewAll={onViewAll}
      />
    </>
  );
}

interface OverviewAsideProps {
  data: FinanceData;
  onBudgets: () => void;
  onCollection: (status: CollectionStatus) => void;
}

/** Right column of the Overview tab, under Needs attention. */
export function OverviewAside({
  data,
  onBudgets,
  onCollection,
}: OverviewAsideProps) {
  const { spending, reserve } = financePlanTotals(data.budgets);
  return (
    <>
      <FinanceCard
        title="Your monthly plan"
        description="Spending limits and reserve allocations are kept separate."
      >
        {!data.budgets.length ? (
          <EmptyState
            className="py-6"
            icon={IconTargetArrow}
            title="No plan for this month yet"
            description="Set spending limits and reserve goals for this month to see your plan here."
          />
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
        <Button variant="secondary" className="w-full" onPress={onBudgets}>
          View budgets & suggestions
        </Button>
      </FinanceCard>
      <CollectionHealth data={data.collections} onSelect={onCollection} />
    </>
  );
}
