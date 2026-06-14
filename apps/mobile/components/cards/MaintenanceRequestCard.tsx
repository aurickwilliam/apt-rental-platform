import { View, Text } from "react-native";
import { Card, Chip, PressableFeedback } from "heroui-native";
import { IconTool } from "@tabler/icons-react-native";

import { COLORS } from "@repo/constants";

import {
  STATUS_STYLES,
  type MaintenanceRequestStatus,
} from "../../stores/useMaintenanceRequestsStore";

interface MaintenanceRequestCardProps {
  issueTitle: string;
  apartmentName: string;
  tenantName: string;
  reportedDate: string;
  status: MaintenanceRequestStatus;
  onPress?: () => void;
}

export default function MaintenanceRequestCard({
  issueTitle,
  apartmentName,
  tenantName,
  reportedDate,
  status,
  onPress,
}: MaintenanceRequestCardProps) {
  const statusStyle = STATUS_STYLES[status];

  return (
    <PressableFeedback onPress={onPress} className="rounded-2xl overflow-hidden">
      <PressableFeedback.Highlight />
      <Card className="shadow-none border border-grey-200 p-0">
        <Card.Body className="p-4 flex-row gap-4">
          <View className="flex-1 min-w-0 gap-2">
            <View className="flex-row items-start justify-between gap-3">
              <View className="size-8 bg-darkerWhite rounded-full items-center justify-center">
                <IconTool size={18} color={COLORS.light.primary} />
              </View>

              <Text
                className="text-text text-base font-interSemiBold flex-1"
                numberOfLines={1}
              >
                {issueTitle}
              </Text>
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

            <Text className="text-text text-sm font-interSemiBold" numberOfLines={1}>
              {apartmentName}
            </Text>

            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-grey-500 text-xs font-inter" numberOfLines={1}>
                {tenantName}
              </Text>
              <Text className="text-grey-500 text-xs font-inter" numberOfLines={1}>
                {reportedDate}
              </Text>
            </View>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
