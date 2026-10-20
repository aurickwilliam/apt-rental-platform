import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceCard from "./FinanceCard";
import FinanceTabsSkeleton from "./FinanceTabsSkeleton";
import MoneyRowSkeleton from "./MoneyRowSkeleton";
import { ON_PRIMARY_SKELETON_STYLE } from "./financeSkeletonStyles";

export default function FinanceOverviewSkeleton() {
  return (
    <>
      <FinanceCard
        className="bg-primary border-primary"
        testID="finance-skeleton-attention"
      >
        <SkeletonGroup.Item
          className="h-5 w-36 rounded-md"
          style={ON_PRIMARY_SKELETON_STYLE}
        />
        <SkeletonGroup.Item
          className="h-11 w-full rounded-2xl"
          style={ON_PRIMARY_SKELETON_STYLE}
        />
        <SkeletonGroup.Item
          className="h-11 w-full rounded-2xl"
          style={ON_PRIMARY_SKELETON_STYLE}
        />
      </FinanceCard>
      <FinanceCard testID="finance-skeleton-income">
        <SkeletonGroup.Item className="h-5 w-32 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        <SkeletonGroup.Item className="h-3 w-2/3 rounded-md" />
        <FinanceTabsSkeleton activeIndex={1} />
        <View className="flex-row flex-wrap gap-2">
          {[0, 1, 2].map((legend) => (
            <SkeletonGroup.Item
              key={legend}
              className="h-7 w-24 rounded-full"
            />
          ))}
        </View>
        <SkeletonGroup.Item className="h-40 w-full rounded-2xl" />
      </FinanceCard>
      <FinanceCard testID="finance-skeleton-collections">
        <SkeletonGroup.Item className="h-5 w-36 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        <SkeletonGroup.Item className="h-3 w-4/5 rounded-md" />
        <MoneyRowSkeleton />
        <SkeletonGroup.Item className="h-12 w-full rounded-xl" />
        {[0, 1, 2].map((row) => (
          <SkeletonGroup.Item key={row} className="h-9 w-full rounded-full" />
        ))}
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
      </FinanceCard>
      <FinanceCard testID="finance-skeleton-monthly-plan">
        <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-full rounded-md" />
        <MoneyRowSkeleton />
        <MoneyRowSkeleton />
        <SkeletonGroup.Item className="h-10 w-full rounded-full" />
      </FinanceCard>
      <FinanceCard testID="finance-skeleton-performance">
        <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-2/3 rounded-md" />
        <FinanceTabsSkeleton />
        {[0, 1, 2].map((row) => (
          <View key={row} className="gap-2">
            <MoneyRowSkeleton />
            <SkeletonGroup.Item className="h-2 w-full rounded-full" />
          </View>
        ))}
      </FinanceCard>
    </>
  );
}
