import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

// Mirrors the loaded screen, top to bottom: apartment picker, four tiles, the status
// menu beside the round filter button, then payment cards.
export default function LandlordPaymentsSkeleton() {
  return (
    <SkeletonGroup isLoading className="gap-4" accessibilityLabel="Loading payments">
      <View className="gap-2">
        <SkeletonGroup.Item className="h-5 w-24 rounded-md" />
        <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
      </View>

      <View className="gap-3">
        <View className="flex-row gap-3">
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
        </View>
        <View className="flex-row gap-3">
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
        </View>
      </View>

      <View className="flex-row items-center gap-3">
        <SkeletonGroup.Item className="flex-1 h-12 rounded-2xl" />
        <SkeletonGroup.Item className="size-12 rounded-full" />
      </View>

      <View className="gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonGroup.Item key={index} className="h-28 w-full rounded-3xl" />
        ))}
      </View>
    </SkeletonGroup>
  );
}
