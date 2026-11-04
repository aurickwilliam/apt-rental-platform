import { View, Text } from "react-native";

import { Button, LinkButton } from "heroui-native";

import { IconPlus, IconTool } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import type { MaintenanceRequest } from "@/hooks/maintenance-requests";
import { MAINTENANCE_PREVIEW_LIMIT } from "@/constants/maintenance-dashboard";

import MaintenanceRequestCard from "./MaintenanceRequestCard";
import EmptyState from "@/components/display/EmptyState";

const isOpen = (request: MaintenanceRequest) =>
  request.status === "Pending" || request.status === "In Progress";

interface MaintenanceSectionProps {
  // Newest first, as the history query returns them.
  requests: MaintenanceRequest[];
  onOpenRequest: (request: MaintenanceRequest) => void;
  onViewAll: () => void;
  onRequestMaintenance: () => void;
}

// Keep repairs in progress visible without blocking another request. Once
// none remain open, retain just the most recently resolved request.
export default function MaintenanceSection({
  requests,
  onOpenRequest,
  onViewAll,
  onRequestMaintenance,
}: MaintenanceSectionProps) {
  const { colors } = useColors();
  const activeRequests = requests.filter(isOpen);
  const visibleRequests = activeRequests.length > 0
    ? activeRequests.slice(0, MAINTENANCE_PREVIEW_LIMIT)
    : requests.filter((request) => request.status === "Resolved")
      .sort((left, right) => Date.parse(right.resolved_at ?? right.created_at)
        - Date.parse(left.resolved_at ?? left.created_at) || right.id.localeCompare(left.id))
      .slice(0, 1);

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

      {visibleRequests.length === 0 ? (
        <EmptyState
          className="py-4"
          icon={IconTool}
          title="No active maintenance requests"
          description="Report an issue with your rental."
        />
      ) : (
        <View className="gap-3">
          {visibleRequests.map((request) => (
            <MaintenanceRequestCard
              key={request.id}
              request={request}
              onPress={() => onOpenRequest(request)}
            />
          ))}
        </View>
      )}

      {requests.length > 0 && (
        <LinkButton className="self-end" onPress={onViewAll}>
          <LinkButton.Label className="text-accent">View all</LinkButton.Label>
        </LinkButton>
      )}
      <Button size="sm" onPress={onRequestMaintenance}>
        <IconPlus size={20} color={colors.secondaryForeground} />
        <Button.Label>Request Maintenance</Button.Label>
      </Button>
    </View>
  );
}
