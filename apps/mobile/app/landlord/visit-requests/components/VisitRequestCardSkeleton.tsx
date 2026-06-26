import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

export default function VisitRequestCardSkeleton() {
  return (
    <SkeletonGroup>
      <View className="flex-row items-center gap-3 p-4 bg-surface rounded-2xl border border-border">
        {/* Avatar */}
        <SkeletonGroup.Item className="w-11 h-11 rounded-full" />

        {/* Main content */}
        <View className="flex-1 gap-2">
          {/* Tenant name */}
          <SkeletonGroup.Item className="h-4 w-32 rounded-full" />
          {/* Apartment name */}
          <SkeletonGroup.Item className="h-3 w-48 rounded-full" />
          {/* Schedule */}
          <SkeletonGroup.Item className="h-3 w-40 rounded-full" />
        </View>

        {/* Status badge */}
        <SkeletonGroup.Item className="h-6 w-20 rounded-full" />
      </View>
    </SkeletonGroup>
  );
}
