import { View, Text, TouchableOpacity } from "react-native";
import type { ReactNode } from "react";

type SectionHeaderProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
};

export function SeeAllButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Text className="font-nunitoSemiBold text-sm text-accent">See All</Text>
    </TouchableOpacity>
  );
}

export default function SectionHeader({
  icon,
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  const wrapperClass = className ?? "mt-10 px-5";
  const hasAction = !!action;

  return (
    <View className={wrapperClass}>
      <View
        className={
          hasAction
            ? "flex-row items-center justify-between"
            : "flex-row items-center gap-2"
        }
      >
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className="font-nunitoSemiBold text-lg text-foreground">
            {title}
          </Text>
        </View>
        {hasAction ? action : null}
      </View>
      {subtitle ? (
        <Text className="text-muted font-inter text-sm mt-1">{subtitle}</Text>
      ) : null}
    </View>
  );
}
