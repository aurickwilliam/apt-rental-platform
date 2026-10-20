import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceLoadingState from "./FinanceLoadingState";
import MoneyRowSkeleton from "./MoneyRowSkeleton";

/** Budget category drill-down: heading summary and one card per property. */
export default function BudgetCategorySkeleton() {
  return (
    <FinanceLoadingState label="Loading budget category">
      <SkeletonGroup
        isLoading
        className="gap-4"
        testID="budget-category-skeleton"
      >
        <View testID="budget-category-skeleton-heading" className="gap-1">
          <SkeletonGroup.Item className="h-6 w-36 rounded-md" />
          <SkeletonGroup.Item className="h-4 w-44 rounded-md" />
          <SkeletonGroup.Item className="h-4 w-3/4 rounded-md" />
        </View>
        {[0, 1, 2].map((row) => (
          <View
            key={row}
            className="bg-surface border border-border rounded-3xl p-4 gap-3"
          >
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
          </View>
        ))}
      </SkeletonGroup>
    </FinanceLoadingState>
  );
}
