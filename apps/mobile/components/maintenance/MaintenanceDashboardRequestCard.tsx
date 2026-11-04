import { Text, View } from "react-native";
import { Button, Card, Chip, PressableFeedback } from "heroui-native";
import { IconCalendarEvent, IconChevronRight, IconStack } from "@tabler/icons-react-native";
import { MAINTENANCE_CATEGORIES, MAINTENANCE_URGENCY } from "@repo/constants";
import { formatDate } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import { statusChipSurface } from "@/hooks/useStatusChipStyles";
import { useMaintenanceRequestStatusStyles, useMaintenanceRequestUrgencyStyles } from "@/hooks/maintenance-requests";
import type { MaintenanceRequest } from "@/service/maintenance-requests/maintenanceService";

interface MaintenanceDashboardRequestCardProps {
  request: MaintenanceRequest;
  onPress: (request: MaintenanceRequest) => void;
}

export default function MaintenanceDashboardRequestCard({ request, onPress }: MaintenanceDashboardRequestCardProps) {
  const { colors } = useColors();
  const statuses = useMaintenanceRequestStatusStyles();
  const urgencies = useMaintenanceRequestUrgencyStyles();
  const status = statuses[request.status];
  const urgency = urgencies[request.urgency];
  const category = MAINTENANCE_CATEGORIES.find((item) => item.value === request.category)?.label ?? request.category;
  const urgencyLabel = MAINTENANCE_URGENCY.find((item) => item.value === request.urgency)?.label ?? request.urgency;
  const isHistory = request.status === "Resolved" || request.status === "Cancelled";
  const content = (
    <Card className="rounded-2xl border border-border bg-surface shadow-none">
      <Card.Body className="gap-3">
        <View className="flex-row items-start justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <View className="h-6 w-1 shrink-0 rounded-full bg-accent" />
            <Text className="min-w-0 flex-1 font-nunitoBold text-base text-foreground">{request.title}</Text>
          </View>
          <View className="max-w-[60%] flex-row flex-wrap justify-end gap-1">
            <Chip size="sm" variant="soft" animation="disable-all" style={statusChipSurface(urgency)}><Chip.Label className="font-nunitoSemiBold text-xs" style={{ color: urgency.textColor }}>{urgencyLabel} urgency</Chip.Label></Chip>
            <Chip size="sm" variant="soft" animation="disable-all" style={statusChipSurface(status)}><Chip.Label className="font-nunitoSemiBold text-xs" style={{ color: status.textColor }}>{request.status}</Chip.Label></Chip>
          </View>
        </View>
        <View className="flex-row items-start gap-3">
          <View className="min-w-0 flex-1 flex-row items-start gap-2">
            <View className="shrink-0"><IconStack size={17} color={colors.textSecondary} /></View>
            <Text className="min-w-0 flex-1 font-inter text-xs text-muted">{category}</Text>
          </View>
          <View className="min-w-0 flex-1 flex-row items-start gap-2">
            <View className="shrink-0"><IconCalendarEvent size={17} color={colors.textSecondary} /></View>
            <Text className="min-w-0 flex-1 font-inter text-xs text-muted">Reported {formatDate(request.created_at, "medium")}</Text>
          </View>
        </View>
        {!isHistory && <Button variant="secondary" size="sm" className="min-h-11 self-end" accessibilityLabel={`View details for ${request.title}`} onPress={() => onPress(request)}>
          <Button.Label>View details</Button.Label><IconChevronRight size={18} color={colors.primaryLightForeground} />
        </Button>}
      </Card.Body>
    </Card>
  );
  if (!isHistory) return content;
  return (
    <PressableFeedback
      className="overflow-hidden rounded-2xl"
      accessibilityRole="button"
      accessibilityLabel={`View details for ${request.title}`}
      accessibilityHint="Opens maintenance request details"
      onPress={() => onPress(request)}
    >
      <PressableFeedback.Highlight />
      {content}
    </PressableFeedback>
  );
}
