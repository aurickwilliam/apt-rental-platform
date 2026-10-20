import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

interface FinanceHeadingSkeletonProps {
  testID?: string;
}

/** Property (or "All properties") and month above each finance page. */
export default function FinanceHeadingSkeleton({
  testID,
}: FinanceHeadingSkeletonProps) {
  return (
    <View testID={testID} className="gap-1">
      <SkeletonGroup.Item className="h-6 w-36 rounded-md" />
      <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
    </View>
  );
}
