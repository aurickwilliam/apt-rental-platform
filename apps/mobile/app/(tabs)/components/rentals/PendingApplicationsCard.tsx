import { View, Text } from "react-native";

import { Card, PressableFeedback } from "heroui-native";

import {
  IconChevronRight,
  IconClipboardText,
} from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import {
  statusChipSurface,
  useStatusChipStyles,
} from "@/hooks/useStatusChipStyles";

interface PendingApplicationsCardProps {
  count: number;
  onPress: () => void;
}

// Shown on the rental page when the tenant also has applications waiting on a
// landlord, which that page otherwise only reaches through Quick Actions.
export default function PendingApplicationsCard({
  count,
  onPress,
}: PendingApplicationsCardProps) {
  const { colors } = useColors();
  const { warning } = useStatusChipStyles();
  const title = `${count} pending application${count === 1 ? "" : "s"}`;

  return (
    <PressableFeedback
      onPress={onPress}
      className="rounded-3xl"
      accessibilityRole="button"
      accessibilityLabel={`${title}. View applications`}
    >
      <PressableFeedback.Highlight />
      <Card className="border border-border shadow-none rounded-3xl">
        <Card.Body className="flex-row items-center gap-3">
          <View
            className="size-10 rounded-full items-center justify-center"
            style={statusChipSurface(warning)}
          >
            <IconClipboardText size={20} color={warning.textColor} />
          </View>

          <View className="flex-1">
            <Text
              className="text-foreground font-nunitoSemiBold text-base"
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text className="text-muted font-inter text-xs" numberOfLines={1}>
              Waiting for the landlord&apos;s review
            </Text>
          </View>

          <IconChevronRight size={16} color={colors.gray500} />
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
