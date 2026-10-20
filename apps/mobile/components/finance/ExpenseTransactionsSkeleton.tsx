import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceLoadingState from "./FinanceLoadingState";
import FinanceHeadingSkeleton from "./FinanceHeadingSkeleton";
import MoneyRowSkeleton from "./MoneyRowSkeleton";

/** Category expenses drill-down: heading and transaction cards. */
export default function ExpenseTransactionsSkeleton() {
  return (
    <FinanceLoadingState label="Loading expenses">
      <SkeletonGroup
        isLoading
        className="gap-4"
        testID="expense-transactions-skeleton"
      >
        <FinanceHeadingSkeleton testID="expense-transactions-skeleton-heading" />
        {[0, 1, 2, 3, 4].map((row) => (
          <View
            key={row}
            className="bg-surface border border-border rounded-2xl p-3 gap-2"
          >
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-3 w-2/3 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-1/2 rounded-md" />
          </View>
        ))}
      </SkeletonGroup>
    </FinanceLoadingState>
  );
}
