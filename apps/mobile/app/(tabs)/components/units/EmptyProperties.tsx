import { View, Text } from "react-native";

import { Building, CirclePlus } from "lucide-react-native";

import { Button } from "heroui-native";

import { useColors } from "@/hooks/useTheme";

type Props = {
  onAdd: () => void;
};

export default function EmptyProperties({ onAdd }: Props) {
  const { colors } = useColors();

  return (
    <View className="items-center justify-center py-16 gap-4">
      <View className="bg-gray-100 rounded-full p-6">
        <Building size={48} color={colors.gray500} />
      </View>
      <View className="items-center gap-1">
        <Text className="text-text text-lg font-interSemiBold">
          No properties yet
        </Text>
        <Text className="text-gray-400 text-sm font-inter text-center px-8">
          Add your first property to start managing your rentals.
        </Text>
      </View>
      <Button onPress={onAdd}>
        <CirclePlus size={20} color={colors.white} />
        <Button.Label>Add Property</Button.Label>
      </Button>
    </View>
  );
}
