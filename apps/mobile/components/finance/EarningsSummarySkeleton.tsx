import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import MoneyRowSkeleton from "./MoneyRowSkeleton";

export default function EarningsSummarySkeleton() {
  return (
    <View
      testID="finance-skeleton-summary"
      className="bg-surface border border-border rounded-3xl overflow-hidden"
    >
      <View className="bg-primary-light p-5 gap-2">
        <SkeletonGroup.Item className="h-4 w-32 rounded-md" />
        <SkeletonGroup.Item className="h-8 w-40 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-48 rounded-md" />
        <SkeletonGroup.Item className="h-3 w-3/4 rounded-md" />
      </View>
      <View className="p-4 gap-3">
        <MoneyRowSkeleton />
        <MoneyRowSkeleton />
        <SkeletonGroup.Item className="h-9 w-full rounded-full" />
      </View>
    </View>
  );
}
