import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import { FinanceCard } from "./FinanceControls";

interface FinanceSkeletonProps {
  tab: "overview" | "expenses" | "budget";
}

export function ExpenseEntrySkeleton() {
  return (
    <View
      accessible
      accessibilityLabel="Loading expense form"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <SkeletonGroup
          isLoading
          className="gap-4"
          testID="expense-entry-skeleton"
        >
          <SkeletonGroup.Item className="h-4 w-full rounded-md" />
          <SkeletonGroup.Item className="h-4 w-4/5 rounded-md" />
          {[0, 1, 2].map((field) => (
            <View key={field} className="gap-2">
              <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
              <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
            </View>
          ))}
          <View className="gap-2">
            <SkeletonGroup.Item className="h-3 w-full rounded-md" />
            <SkeletonGroup.Item className="h-3 w-4/5 rounded-md" />
          </View>
          {[0, 1, 2].map((field) => (
            <View key={`details-${field}`} className="gap-2">
              <SkeletonGroup.Item className="h-4 w-24 rounded-md" />
              <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
            </View>
          ))}
        </SkeletonGroup>
      </View>
    </View>
  );
}

export function ExpenseEntryFooterSkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SkeletonGroup isLoading className="flex-row gap-3">
        <SkeletonGroup.Item className="h-12 flex-1 rounded-full" />
        <SkeletonGroup.Item className="h-12 flex-1 rounded-full" />
      </SkeletonGroup>
    </View>
  );
}

function ChartPlaceholder() {
  return <FinanceCard>
    <SkeletonGroup.Item className="h-6 w-40 rounded-md" />
    <SkeletonGroup.Item className="h-4 w-3/4 rounded-md" />
    <SkeletonGroup.Item className="h-10 w-full rounded-full" />
    <SkeletonGroup.Item className="h-48 w-full rounded-2xl" />
  </FinanceCard>;
}

export default function FinanceSkeleton({ tab }: FinanceSkeletonProps) {
  return <View accessible accessibilityLabel="Loading profit and planning" accessibilityRole="progressbar" accessibilityState={{ busy: true }}>
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SkeletonGroup isLoading className="gap-5" testID={`finance-skeleton-${tab}`}>
        <View className="bg-surface border border-border rounded-3xl overflow-hidden">
          <View className="bg-primary-light p-5 gap-2">
            <SkeletonGroup.Item className="h-5 w-32 rounded-md" />
            <SkeletonGroup.Item className="h-9 w-40 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-48 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-full rounded-md" />
          </View>
          <View className="p-4 gap-3">
            {[0, 1].map((row) => <View key={row} className="flex-row items-center justify-between gap-3">
              <SkeletonGroup.Item className="h-5 w-1/2 rounded-md" />
              <SkeletonGroup.Item className="h-5 w-20 rounded-md" />
            </View>)}
            <SkeletonGroup.Item className="h-9 w-full rounded-full" />
            <SkeletonGroup.Item className="h-9 w-full rounded-full" />
          </View>
        </View>
        <SkeletonGroup.Item className="h-12 w-full rounded-full" />
        {tab === "overview" && <>
          <ChartPlaceholder />
          <FinanceCard>
            <SkeletonGroup.Item className="h-6 w-36 rounded-md" />
            <SkeletonGroup.Item className="h-10 w-full rounded-full" />
            <SkeletonGroup.Item className="h-10 w-full rounded-full" />
          </FinanceCard>
        </>}
        {tab === "expenses" && <>
          <FinanceCard>
            <SkeletonGroup.Item className="h-6 w-40 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-full rounded-md" />
            <SkeletonGroup.Item className="h-10 w-full rounded-full" />
          </FinanceCard>
          <ChartPlaceholder />
        </>}
        {tab === "budget" && <>
          {[0, 1, 2].map((row) => <FinanceCard key={row}>
            <SkeletonGroup.Item className="h-6 w-40 rounded-md" />
            <SkeletonGroup.Item className="h-4 w-3/4 rounded-md" />
            <SkeletonGroup.Item className="h-3 w-full rounded-full" />
            <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
          </FinanceCard>)}
        </>}
      </SkeletonGroup>
    </View>
  </View>;
}
