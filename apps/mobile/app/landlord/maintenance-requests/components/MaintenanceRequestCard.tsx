import { View, Text } from "react-native";
import { Card, Chip, PressableFeedback } from "heroui-native";

import { Hammer } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";
import { useMaintenanceRequestStatusStyles } from "@/hooks/maintenance-requests";
import type { MaintenanceRequestStatus } from "@/hooks/maintenance-requests";

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
  const { colors } = useColors();

  const statusStyles = useMaintenanceRequestStatusStyles();
  const statusStyle = statusStyles[status];

  return (
    <PressableFeedback onPress={onPress} className="rounded-3xl overflow-hidden">
      <PressableFeedback.Highlight />
      <Card className="shadow-none border border-border p-0">
        <Card.Body className="p-4 flex-row gap-4">
          <View className="flex-1 min-w-0 gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <View className="size-8 bg-surface-secondary rounded-full items-center justify-center">
                <Hammer size={18} color={colors.primary} />
              </View>

              <View className="flex-1">
                <Text
                  className="text-foreground text-sm font-interMedium"
                  numberOfLines={1}
                >
                  {issueTitle}
                </Text>

                <Text
                  className="text-muted text-xs font-inter"
                  numberOfLines={1}
                >
                  {apartmentName}
                </Text>
              </View>

              {/* Maintenance Request Status */}
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

            <View className="flex-row items-center justify-between gap-3">
              <Text
                className="text-muted text-xs font-inter"
                numberOfLines={1}
              >
                By {tenantName}
              </Text>
              <Text
                className="text-muted text-xs font-inter"
                numberOfLines={1}
              >
                {reportedDate}
              </Text>
            </View>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
