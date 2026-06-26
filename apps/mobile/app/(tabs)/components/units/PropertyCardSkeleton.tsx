import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

export default function PropertyCardSkeleton() {
  return (
    <SkeletonGroup
      isLoading
      className="bg-surface rounded-3xl p-4 flex-row gap-3 border border-border"
    >
      <SkeletonGroup.Item className="w-20 h-20 rounded-xl" />
      <View className="flex-1 gap-2 justify-center">
        <SkeletonGroup.Item className="h-4 rounded-full w-3/4" />
        <SkeletonGroup.Item className="h-3 rounded-full w-1/2" />
        <SkeletonGroup.Item className="h-3 rounded-full w-1/3" />
      </View>
    </SkeletonGroup>
  );
}
