import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

export default function PassportSkeleton() {
  return (
    <SkeletonGroup isLoading>
      <View className="gap-3">
        {/* Hero ID header */}
        <SkeletonGroup.Item className="h-5 w-48 rounded-md" />
        <SkeletonGroup.Item className="h-4 w-32 rounded-md" />

        {/* Hero ID media */}
        <SkeletonGroup.Item className="h-52 w-full rounded-3xl" />

        {/* Supporting documents grid */}
        <View className="flex-row flex-wrap gap-x-4 gap-y-5 mt-2">
          {[...Array(4)].map((_, index) => (
            // Width lives on a plain View: the item renders an Animated.View
            // that ignores the arbitrary percentage.
            <View key={index} className="w-[47.5%]">
              <SkeletonGroup.Item className="h-56 w-full rounded-3xl" />
            </View>
          ))}
        </View>
      </View>
    </SkeletonGroup>
  );
}
