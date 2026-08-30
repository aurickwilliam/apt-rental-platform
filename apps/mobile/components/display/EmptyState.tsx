import { View, Text } from "react-native";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  className?: string;
  variant?: "tenant" | "landlord";
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title,
  description,
  className,
  variant = "landlord",
  action,
}: EmptyStateProps) {
  if (variant === "tenant") {
    return (
      <View className={`items-center justify-center gap-4 py-20 px-5 ${className ?? ""}`}>
        {icon}
        <View className="items-center gap-1">
          <Text className="text-foreground text-xl font-nunitoBold text-center">
            {title}
          </Text>
          {description ? (
            <Text className="text-gray-400 text-base font-inter text-center px-8">
              {description}
            </Text>
          ) : null}
        </View>
        {action ? <View className="mt-2">{action}</View> : null}
      </View>
    );
  }

  return (
    <View className={`items-center justify-center py-10 gap-4 ${className ?? ""}`}>
      <View className="bg-gray-100 rounded-full p-5">
        {icon}
      </View>
      <View className="items-center gap-1">
        <Text className="text-foreground text-lg font-nunitoBold">
          {title}
        </Text>
        {description ? (
          <Text className="text-gray-500 text-sm font-inter text-center px-8">
            {description}
          </Text>
        ) : null}
      </View>
      {action ? <View className="mt-2">{action}</View> : null}
    </View>
  );
}