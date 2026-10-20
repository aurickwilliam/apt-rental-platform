import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

export default function EntryFormFooterSkeleton() {
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
