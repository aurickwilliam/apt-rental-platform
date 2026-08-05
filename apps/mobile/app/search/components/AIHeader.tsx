import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronLeft } from 'lucide-react-native';
import { IconSparkles } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface AIHeaderProps {
  onBackPress?: () => void;
}

export default function AIHeader({ onBackPress }: AIHeaderProps) {
  const { colors } = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      className="flex-row items-center justify-between bg-accent px-4"
      style={{ paddingTop: insets.top, height: insets.top + 56 }}
    >
      {/* Back button */}
      <View className="w-10 items-start justify-center">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          className="p-1 -ml-1"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color={colors.secondaryForeground} />
        </TouchableOpacity>
      </View>

      {/* AI identity */}
      <View className="flex-1 flex-row items-center justify-start ml-2">
        <View
          className="w-9 h-9 rounded-full items-center justify-center mr-3 border border-white"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          accessibilityLabel="APT AI assistant"
        >
          <IconSparkles size={18} color="#FFFFFF" />
        </View>

        <View className="shrink">
          <Text
            className="text-base text-secondary-foreground font-interMedium"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Casa

          </Text>
        </View>
      </View>

      {/* Right spacer */}
      <View className="w-10 items-end justify-center" />
    </View>
  );
}