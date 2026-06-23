import { View, Text } from "react-native";
import { Avatar, Card, Chip, PressableFeedback } from "heroui-native";

import { COLORS } from "@repo/constants";

type TenantApplicationStatus = "Applied" | "Approved" | "Rejected";

interface TenantApplicationCardProps {
  tenantName: string;
  apartmentName: string;
  status: TenantApplicationStatus;
  submittedDate: string;
  avatarUrl?: string;
  onPress?: () => void;
}

const STATUS_STYLES: Record<
  TenantApplicationStatus,
  { backgroundColor: string; textColor: string }
> = {
  Applied: {
    backgroundColor: COLORS.light.warningLight,
    textColor: COLORS.light.warning,
  },
  Approved: {
    backgroundColor: COLORS.light.successLight,
    textColor: COLORS.light.success,
  },
  Rejected: {
    backgroundColor: COLORS.light.dangerLight,
    textColor: COLORS.light.danger,
  },
};

const getInitials = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return "U";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

export default function TenantApplicationCard({
  tenantName,
  apartmentName,
  status,
  submittedDate,
  avatarUrl,
  onPress,
}: TenantApplicationCardProps) {
  const statusStyle = STATUS_STYLES[status];

  return (
    <PressableFeedback
      onPress={onPress}
      className="rounded-3xl overflow-hidden border border-border"
    >
      <PressableFeedback.Highlight />
      <Card className="shadow-none p-0">
        <Card.Body className="p-3 flex-row items-center gap-3">
          <Avatar size="lg" className="border border-border">
            <Avatar.Image source={{ uri: avatarUrl }} />
            <Avatar.Fallback delayMs={200}>
              {getInitials(tenantName)}
            </Avatar.Fallback>
          </Avatar>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 min-w-0 h-full">
                <Text
                  className="text-foreground text-sm font-interSemiBold"
                  numberOfLines={1}
                >
                  {tenantName}
                </Text>
                <Text
                  className="text-muted text-xs font-inter"
                  numberOfLines={1}
                >
                  {apartmentName}
                </Text>
              </View>

              <View className="items-end gap-3">
                <Chip
                  size="sm"
                  variant="soft"
                  style={{ backgroundColor: statusStyle.backgroundColor }}
                >
                  <Chip.Label
                    className="font-interMedium"
                    style={{ color: statusStyle.textColor }}
                  >
                    {status}
                  </Chip.Label>
                </Chip>

                <Text className="text-muted text-xs font-inter">
                  {submittedDate}
                </Text>
              </View>
            </View>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
