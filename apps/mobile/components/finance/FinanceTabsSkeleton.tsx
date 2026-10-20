import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

interface FinanceTabsSkeletonProps {
  activeIndex?: number;
  testID?: string;
}

/** Segmented control matching FinanceTabs, with its selected segment white. */
export default function FinanceTabsSkeleton({
  activeIndex = 0,
  testID,
}: FinanceTabsSkeletonProps) {
  return (
    <View
      testID={testID}
      className="flex-row items-center gap-1 rounded-3xl bg-default p-1"
    >
      {[0, 1, 2].map((segment) =>
        segment === activeIndex ? (
          <View
            key={segment}
            className="h-8 flex-1 rounded-3xl bg-surface shadow-sm"
          />
        ) : (
          <SkeletonGroup.Item
            key={segment}
            className="h-8 flex-1 rounded-3xl"
          />
        ),
      )}
    </View>
  );
}
