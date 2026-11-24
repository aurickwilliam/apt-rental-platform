import { View } from "react-native";
import { SkeletonGroup } from "heroui-native";

import { useTranslation } from "@/hooks/i18n";

// Shaped like the Change Email form (current email, new email, password)
// while the current address is read from Auth.
export default function ChangeEmailFormSkeleton() {
  const { t } = useTranslation();

  return (
    <SkeletonGroup>
      <View className="flex gap-4 mt-5" accessibilityLabel={t("auth.changeEmail.loadingAccount")}>
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
