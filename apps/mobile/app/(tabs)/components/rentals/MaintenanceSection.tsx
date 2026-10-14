import { View, Text } from "react-native";

import { Button, LinkButton } from "heroui-native";

import { IconHammer } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import type { MaintenanceRequest } from "@/hooks/maintenance-requests";

import MaintenanceRequestCard from "./MaintenanceRequestCard";

// How many recent requests the Rentals tab lists before "View all".
const RECENT_REQUEST_COUNT = 3;

const isOpen = (request: MaintenanceRequest) =>
  request.status === "Pending" || request.status === "In Progress";

interface MaintenanceSectionProps {
  // Newest first, as the history query returns them.
  requests: MaintenanceRequest[];
  onOpenRequest: (request: MaintenanceRequest) => void;
  onViewAll: () => void;
  onRequestMaintenance: () => void;
}

// Recent maintenance requests for the rented apartment, with the way to file
// a new one. A new request waits until the open one is resolved.
export default function MaintenanceSection({
  requests,
  onOpenRequest,
  onViewAll,
  onRequestMaintenance,
}: MaintenanceSectionProps) {
  const { colors } = useColors();
  const recentRequests = requests.slice(0, RECENT_REQUEST_COUNT);
  const hasOpenRequest = requests.some(isOpen);

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <IconHammer size={24} color={colors.textPrimary} />
          <Text className="text-foreground text-lg font-nunitoSemiBold">
            Maintenance
          </Text>
        </View>
        {requests.length > 0 && (
          <LinkButton onPress={onViewAll}>
            <LinkButton.Label className="text-accent">View all</LinkButton.Label>
          </LinkButton>
        )}
      </View>

      {recentRequests.length === 0 ? (
        <Text className="text-muted font-inter text-sm">
          No maintenance requests yet. Report an issue and your landlord will be notified.
        </Text>
      ) : (
        recentRequests.map((request) => (
          <MaintenanceRequestCard
            key={request.id}
            request={request}
            onPress={() => onOpenRequest(request)}
          />
        ))
      )}

      {hasOpenRequest ? (
        <Text className="text-muted font-inter text-sm">
          You can file a new request once your open one is resolved.
        </Text>
      ) : (
        <Button onPress={onRequestMaintenance}>
          <IconHammer size={20} color={colors.secondaryForeground} />
          <Button.Label>Request Maintenance</Button.Label>
        </Button>
      )}
    </View>
  );
}
