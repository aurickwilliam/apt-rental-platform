import { TouchableOpacity, Text, View } from "react-native";
import { IconProps } from "@tabler/icons-react-native";

import { COLORS } from "../../constants/colors";

interface QuickActionButtonProps {
  label: string;
  icon: React.ComponentType<IconProps>;
  onPress?: () => void;
}

export default function QuickActionButton({
  label,
  icon: Icon,
  onPress
}: QuickActionButtonProps) {
  return (
    <View className="w-1/4 px-2 mb-4">
      <TouchableOpacity
        className="flex items-center justify-center gap-2"
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Icon Label */}
        <View className="aspect-square p-4 bg-darkerWhite justify-center items-center rounded-xl">
          <Icon
            size={30}
            color={COLORS.mediumGrey}
            strokeWidth={2}
          />
        </View>

        {/* Text Label */}
        <Text className="text-center text-[12px] text-grey-500 font-inter">
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
