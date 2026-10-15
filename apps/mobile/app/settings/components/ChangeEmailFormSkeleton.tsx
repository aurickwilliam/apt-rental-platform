import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

// Shaped like the Change Email form (current email, new email, password)
// while the current address is read from Auth.
export default function ChangeEmailFormSkeleton() {
  return (
    <SkeletonGroup>
      <View className="flex gap-4 mt-5" accessibilityLabel="Loading your account">
        {[0, 1, 2].map((field) => (
          <View key={field} className="gap-2">
            <SkeletonGroup.Item className="h-4 w-28 rounded-full" />
            <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}
