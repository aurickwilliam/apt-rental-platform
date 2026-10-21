import { SkeletonGroup } from "heroui-native";
import FinanceLoadingState from "./FinanceLoadingState";
import FinanceHeadingSkeleton from "./FinanceHeadingSkeleton";
import EarningsSummarySkeleton from "./EarningsSummarySkeleton";
import FinanceTabsSkeleton from "./FinanceTabsSkeleton";
import FinanceOverviewSkeleton from "./FinanceOverviewSkeleton";
import FinanceExpensesSkeleton from "./FinanceExpensesSkeleton";
import FinanceBudgetSkeleton from "./FinanceBudgetSkeleton";

interface FinanceSkeletonProps {
  tab: "overview" | "expenses" | "budget";
}

const TAB_INDEX: Record<FinanceSkeletonProps["tab"], number> = {
  overview: 0,
  expenses: 1,
  budget: 2,
};

/** Mirrors the loaded report: heading, earnings, tabs, tab content and guidelines. */
export default function FinanceSkeleton({ tab }: FinanceSkeletonProps) {
  return (
    <FinanceLoadingState label="Loading profit and planning">
      <SkeletonGroup
        isLoading
        className="gap-5"
        testID={`finance-skeleton-${tab}`}
      >
        <FinanceHeadingSkeleton testID="finance-skeleton-heading" />
        <EarningsSummarySkeleton />
        <FinanceTabsSkeleton
          activeIndex={TAB_INDEX[tab]}
          testID="finance-skeleton-tabs"
        />
        {tab === "overview" && <FinanceOverviewSkeleton />}
        {tab === "expenses" && <FinanceExpensesSkeleton />}
        {tab === "budget" && <FinanceBudgetSkeleton />}
        <SkeletonGroup.Item
          testID="finance-skeleton-guidelines"
          className="h-4 w-40 rounded-md"
        />
      </SkeletonGroup>
    </FinanceLoadingState>
  );
}
