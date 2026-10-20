import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceLoadingState from "./FinanceLoadingState";
import FinanceHeadingSkeleton from "./FinanceHeadingSkeleton";
import FinanceTabsSkeleton from "./FinanceTabsSkeleton";
import FinanceCard from "./FinanceCard";
import MoneyRowSkeleton from "./MoneyRowSkeleton";

/** Property performance drill-down: heading, metric tabs, ranked property rows. */
export default function PropertyPerformanceSkeleton() {
  return (
    <FinanceLoadingState label="Loading property performance">
      <SkeletonGroup
        isLoading
        className="gap-5"
        testID="property-performance-skeleton"
      >
        <FinanceHeadingSkeleton testID="property-performance-skeleton-heading" />
        <FinanceTabsSkeleton testID="property-performance-skeleton-tabs" />
        <FinanceCard testID="property-performance-skeleton-list">
          {[0, 1, 2, 3, 4].map((row) => (
            <View key={row} className="gap-2">
              <MoneyRowSkeleton />
              <SkeletonGroup.Item className="h-2 w-full rounded-full" />
              <SkeletonGroup.Item className="h-3 w-1/3 rounded-md" />
            </View>
          ))}
        </FinanceCard>
      </SkeletonGroup>
    </FinanceLoadingState>
  );
}
