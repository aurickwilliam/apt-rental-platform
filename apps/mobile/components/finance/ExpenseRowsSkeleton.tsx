import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceLoadingState from "./FinanceLoadingState";
import MoneyRowSkeleton from "./MoneyRowSkeleton";

/** Transaction card placeholders, also used while only the list loads. */
export default function ExpenseRowsSkeleton() {
  return (
    <FinanceLoadingState label="Loading expenses list">
      <SkeletonGroup isLoading className="gap-4">
        {[0, 1, 2].map((row) => (
          <View
            key={row}
            className="bg-surface border border-border rounded-3xl p-4 gap-2"
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
