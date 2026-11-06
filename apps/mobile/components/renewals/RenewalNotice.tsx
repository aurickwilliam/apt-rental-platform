import { Text, View } from "react-native";
import { IconInfoCircle } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";

interface RenewalNoticeProps { children: string }

export default function RenewalNotice({ children }: RenewalNoticeProps) {
  const { colors } = useColors();
  return (
    <View className="flex-row items-start gap-2 rounded-2xl bg-primary-light p-3">
      <IconInfoCircle size={18} color={colors.primaryLightForeground} />
      <Text className="min-w-0 flex-1 font-inter text-sm leading-5 text-foreground">{children}</Text>
    </View>
  );
}
