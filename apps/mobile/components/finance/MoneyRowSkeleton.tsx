import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

export default function MoneyRowSkeleton() {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
      <SkeletonGroup.Item className="h-4 w-20 rounded-md" />
    </View>
  );
}
