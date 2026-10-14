import { View, Text } from "react-native";

import { Button, LinkButton } from "heroui-native";

import { IconPlus, IconTool } from "@tabler/icons-react-native";

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
  const activeRequests = requests.filter(isOpen);
  const hasOpenRequest = activeRequests.length > 0;

  return (
    <View className="gap-4 rounded-3xl border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground text-lg font-nunitoSemiBold">
          Maintenance
        </Text>
        <View className="rounded-full bg-surface-tertiary px-3 py-1">
          <Text className="text-sm font-nunitoSemiBold text-foreground">
            {activeRequests.length} Active
          </Text>
        </View>
      </View>

      {recentRequests.length === 0 ? (
        <View className="flex-row items-center gap-3">
          <View className="size-12 items-center justify-center rounded-2xl bg-surface-tertiary">
            <IconTool size={24} color={colors.textPrimary} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-nunitoSemiBold text-foreground">
              No maintenance requests
            </Text>
            <Text className="text-xs font-inter text-muted">
              Report an issue with your rental.
            </Text>
          </View>
        </View>
      ) : (
        <View className="gap-3">
          {recentRequests.map((request) => (
            <MaintenanceRequestCard
              key={request.id}
              request={request}
              onPress={() => onOpenRequest(request)}
            />
          ))}
          {requests.length > 0 && (
            <LinkButton className="self-end" onPress={onViewAll}>
              <LinkButton.Label className="text-accent">
                View all
              </LinkButton.Label>
            </LinkButton>
          )}
        </View>
      )}

      {hasOpenRequest ? (
        <Text className="text-muted font-inter text-sm">
          You can file a new request once your open one is resolved.
        </Text>
      ) : (
        <Button size="sm" onPress={onRequestMaintenance}>
          <IconPlus size={20} color={colors.secondaryForeground} />
          <Button.Label>Request Maintenance</Button.Label>
        </Button>
      )}
    </View>
  );
}
