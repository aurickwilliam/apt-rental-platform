import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceCard from "./FinanceCard";
import MoneyRowSkeleton from "./MoneyRowSkeleton";

export default function FinanceBudgetSkeleton() {
  return (
    <>
      <FinanceCard testID="finance-skeleton-budget-groups">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-full rounded-md" />
          </View>
          <SkeletonGroup.Item className="h-8 w-16 rounded-full" />
        </View>
        {[0, 1, 2].map((row) => (
          <View key={row} className="gap-2">
            <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-24 rounded-md" />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
          </View>
        ))}
      </FinanceCard>
      <FinanceCard testID="finance-skeleton-reserves">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <SkeletonGroup.Item className="h-5 w-36 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-full rounded-md" />
          </View>
          <SkeletonGroup.Item className="h-8 w-16 rounded-full" />
        </View>
        {[0, 1].map((row) => (
          <View key={row} className="gap-1">
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
          </View>
        ))}
      </FinanceCard>
    </>
  );
}
