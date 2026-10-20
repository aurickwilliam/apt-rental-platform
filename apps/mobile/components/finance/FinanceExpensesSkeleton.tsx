import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceCard from "./FinanceCard";
import MoneyRowSkeleton from "./MoneyRowSkeleton";
import { ON_PRIMARY_SKELETON_STYLE } from "./financeSkeletonStyles";

export default function FinanceExpensesSkeleton() {
  return (
    <>
      <FinanceCard
        className="bg-primary border-primary"
        testID="finance-skeleton-review"
      >
        <SkeletonGroup.Item
          className="h-5 w-40 rounded-md"
          style={ON_PRIMARY_SKELETON_STYLE}
        />
        <SkeletonGroup.Item
          className="h-3 w-full rounded-md"
          style={ON_PRIMARY_SKELETON_STYLE}
        />
        <SkeletonGroup.Item
          className="h-3 w-4/5 rounded-md"
          style={ON_PRIMARY_SKELETON_STYLE}
        />
        <SkeletonGroup.Item
          className="h-11 w-full rounded-2xl"
          style={ON_PRIMARY_SKELETON_STYLE}
        />
      </FinanceCard>
      <FinanceCard testID="finance-skeleton-categories">
        <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        {[0, 1, 2, 3].map((row) => (
          <View key={row} className="gap-2">
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
            <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
          </View>
        ))}
      </FinanceCard>
    </>
  );
}
