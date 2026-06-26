import { View, Text } from "react-native";

import { Avatar, Card, Chip, PressableFeedback } from "heroui-native";

import { Calendar, Home } from "lucide-react-native";

import { COLORS } from "@repo/constants";
import { useColors } from "@/hooks/useTheme"

import { getInitials } from "@repo/utils";

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
  Rescheduled: {
    backgroundColor: COLORS.light.primaryLight,
    textColor: COLORS.light.primary,
  },
};

export default function VisitRequestCard({
  tenantName,
  apartmentName,
  visitSchedule,
  status,
  avatarUrl,
  onPress,
}: VisitRequestCardProps) {
  const { colors } = useColors();

  const statusStyle = STATUS_STYLES[status];

  return (
    <PressableFeedback onPress={onPress} className="rounded-3xl overflow-hidden">
      <PressableFeedback.Highlight />
      <Card className="shadow-none border border-border p-0">
        <Card.Body className="p-3 flex-row items-center gap-3">
          <Avatar size="lg" className="border border-border">
            <Avatar.Image source={{ uri: avatarUrl }} />
            <Avatar.Fallback delayMs={200}>
              {getInitials(tenantName)}
            </Avatar.Fallback>
          </Avatar>

          <View className="flex-1 min-w-0">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 min-w-0">
                <Text
                  className="text-foreground text-sm font-interMedium"
                  numberOfLines={1}
                >
                  {tenantName}
                </Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <Home size={14} color={colors.gray400} />
                  <Text
                    className="text-muted text-xs font-inter"
                    numberOfLines={1}
                  >
                    {apartmentName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1 mt-2">
                  <Calendar size={14} color={colors.gray400} />
                  <Text
                    className="text-gray-500 text-xs font-inter"
                    numberOfLines={1}
                  >
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
