import { View, Text } from "react-native";
import { Avatar, Card, Chip, PressableFeedback } from "heroui-native";
import { IconCalendarEvent, IconHome } from "@tabler/icons-react-native";

import { COLORS } from "@repo/constants";

export type VisitRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Rescheduled";

interface VisitRequestCardProps {
  tenantName: string;
  apartmentName: string;
  visitSchedule: string;
  status: VisitRequestStatus;
  avatarUrl?: string;
  onPress?: () => void;
}

const STATUS_STYLES: Record<
  VisitRequestStatus,
  { backgroundColor: string; textColor: string }
> = {
  Pending: {
    backgroundColor: COLORS.lightYellowish,
    textColor: COLORS.yellowish,
  },
  Approved: {
    backgroundColor: COLORS.lightGreen,
    textColor: COLORS.greenHulk,
  },
  Rejected: {
    backgroundColor: COLORS.lightLightRedHead,
    textColor: COLORS.lightRedHead,
  },
  Rescheduled: {
    backgroundColor: COLORS.lightBlue,
    textColor: COLORS.primary,
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

export default function VisitRequestCard({
  tenantName,
  apartmentName,
  visitSchedule,
  status,
  avatarUrl,
  onPress,
}: VisitRequestCardProps) {
  const statusStyle = STATUS_STYLES[status];

  return (
    <PressableFeedback onPress={onPress} className="rounded-2xl overflow-hidden">
      <PressableFeedback.Highlight />
      <Card className="shadow-none border border-grey-200 p-0">
        <Card.Body className="p-3 flex-row items-center gap-3">
          <Avatar size="lg" className="border border-secondary">
            <Avatar.Image source={{ uri: avatarUrl }} />
            <Avatar.Fallback delayMs={200}>
              {getInitials(tenantName)}
            </Avatar.Fallback>
          </Avatar>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 min-w-0">
                <Text className="text-text text-sm font-interSemiBold" numberOfLines={1}>
                  {tenantName}
                </Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <IconHome size={14} color={COLORS.grey} />
                  <Text className="text-grey-500 text-xs font-inter" numberOfLines={1}>
                    {apartmentName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 mt-2">
                  <IconCalendarEvent size={14} color={COLORS.grey} />
                  <Text className="text-grey-500 text-xs font-inter" numberOfLines={1}>
                    {visitSchedule}
                  </Text>
                </View>
              </View>

              {status !== "Approved" && (
                <View className="items-end gap-1">
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
                </View>
              )}
            </View>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
