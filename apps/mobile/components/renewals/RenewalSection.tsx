import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Card } from "heroui-native";
import type { Icon } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";

interface RenewalSectionProps {
  title: string;
  description?: string;
  icon: Icon;
  children: ReactNode;
}

export default function RenewalSection({ title, description, icon: IconComponent, children }: RenewalSectionProps) {
  const { colors } = useColors();
  return (
    <Card className="rounded-3xl border border-border bg-surface p-4 shadow-none">
      <Card.Body className="gap-4">
        <View className="flex-row items-start gap-3">
          <View className="size-10 items-center justify-center rounded-2xl bg-primary-light">
            <IconComponent size={22} color={colors.primaryLightForeground} />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text accessibilityRole="header" className="font-nunitoBold text-lg text-foreground">{title}</Text>
            {description && <Text className="font-inter text-sm leading-5 text-muted">{description}</Text>}
          </View>
        </View>
        {children}
      </Card.Body>
    </Card>
  );
}
