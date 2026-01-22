import { View, Text } from "react-native";

interface StatusPillProps {
  status: string;
  color: string;
}

export default function StatusPill({
  status,
  color,
}: StatusPillProps) {

  return (
    <View className="flex-row items-center justify-center bg-white rounded-full p-2 gap-1">
      {/* Circle Indicator */}
      <View
        className={`size-4 rounded-full`}
        style={{ backgroundColor: color }}
      />

      {/* Status Text */}
      <Text className="text-sm font-interMedium text-text">
        {status}
      </Text>
    </View>
  );
}
