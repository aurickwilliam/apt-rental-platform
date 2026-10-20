import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";
import FinanceLoadingState from "./FinanceLoadingState";

interface EntryFormSkeletonProps {
  label: string;
  testID: string;
}

export default function EntryFormSkeleton({
  label,
  testID,
}: EntryFormSkeletonProps) {
  return (
    <FinanceLoadingState label={label}>
      <SkeletonGroup isLoading className="gap-4" testID={testID}>
        <SkeletonGroup.Item className="h-4 w-full rounded-md" />
        <SkeletonGroup.Item className="h-4 w-4/5 rounded-md" />
        {[0, 1, 2].map((field) => (
          <View key={field} className="gap-2">
            <SkeletonGroup.Item className="h-4 w-28 rounded-md" />
            <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
          </View>
        ))}
        <View className="gap-2">
          <SkeletonGroup.Item className="h-3 w-full rounded-md" />
          <SkeletonGroup.Item className="h-3 w-4/5 rounded-md" />
        </View>
        {[0, 1, 2].map((field) => (
          <View key={`details-${field}`} className="gap-2">
            <SkeletonGroup.Item className="h-4 w-24 rounded-md" />
            <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
          </View>
        ))}
      </SkeletonGroup>
    </FinanceLoadingState>
  );
}
