import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

export default function DashboardSkeleton() {
  return (
    <SkeletonGroup isLoading className="flex gap-5">
      {/* Stat cards */}
      <View className="flex gap-3">
        <View className="flex-row gap-3">
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
        </View>
        <View className="flex-row gap-3">
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
          <SkeletonGroup.Item className="flex-1 h-24 rounded-3xl" />
        </View>
      </View>

      {/* Chart cards */}
      <SkeletonGroup.Item className="h-64 w-full rounded-3xl" />
      <SkeletonGroup.Item className="h-64 w-full rounded-3xl" />

      {/* Rent dues */}
      <View className="flex gap-3">
        <View className="flex-row items-center justify-between">
          <SkeletonGroup.Item className="h-5 w-40 rounded-md" />
          <SkeletonGroup.Item className="h-7 w-20 rounded-full" />
        </View>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonGroup.Item key={i} className="h-20 w-full rounded-3xl" />
        ))}
      </View>
    </SkeletonGroup>
  );
}
