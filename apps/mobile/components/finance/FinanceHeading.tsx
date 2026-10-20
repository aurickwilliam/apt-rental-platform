import type { ReactNode } from "react";
import { Text, View } from "react-native";

interface FinanceHeadingProps {
  title: string;
  description?: string;
  action?: ReactNode;
  titleClassName?: string;
  descriptionClassName?: string;
}

export default function FinanceHeading({
  title,
  description,
  action,
  titleClassName,
  descriptionClassName,
}: FinanceHeadingProps) {
  return (
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1 gap-1">
        <Text
          accessibilityRole="header"
          className={`font-nunitoBold text-lg text-foreground${titleClassName ? ` ${titleClassName}` : ""}`}
        >
          {title}
        </Text>
        {description && (
          <Text
            className={`font-inter text-xs text-muted leading-5${descriptionClassName ? ` ${descriptionClassName}` : ""}`}
          >
            {description}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}
