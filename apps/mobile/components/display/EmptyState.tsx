import { View, Text } from "react-native";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center py-10 gap-4 ${className ?? ""}`}>
      <View className="bg-gray-100 rounded-full p-5">
        {icon}
      </View>
      <View className="items-center gap-1">
        <Text className="text-foreground text-lg font-interSemiBold">
          {title}
        </Text>
        {description ? (
          <Text className="text-gray-500 text-sm font-inter text-center px-8">
            {description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}