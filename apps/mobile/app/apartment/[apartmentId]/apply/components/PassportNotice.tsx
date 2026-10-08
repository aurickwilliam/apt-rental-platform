import { Text, View } from "react-native";

import { IconInfoCircle } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

/** Explains that no document upload step exists: the APT Passport is attached. */
export default function PassportNotice() {
  const { colors } = useColors();

  return (
    <View className="flex-row gap-3 bg-primary-light border border-primary/30 rounded-2xl p-3">
      <IconInfoCircle size={20} color={colors.primary} />
      <View className="flex-1 gap-0.5">
        <Text className="text-foreground text-sm font-nunitoSemiBold">
          Your APT Passport is submitted automatically
        </Text>
        <Text className="text-muted text-sm font-inter leading-snug">
          Your ID and supporting documents are sent with your application, so
          there is nothing to upload. Keep them current in APT Passport.
        </Text>
      </View>
    </View>
  );
}
