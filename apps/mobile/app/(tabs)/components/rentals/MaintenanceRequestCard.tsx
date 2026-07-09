import { View, Text } from 'react-native';

import { Card, Chip, PressableFeedback } from 'heroui-native';

import { MAINTENANCE_CATEGORIES, MAINTENANCE_URGENCY } from '@repo/constants';

import {
  useMaintenanceRequestStatusStyles,
  useMaintenanceRequestUrgencyStyles,
} from '@/hooks/maintenance-requests';
import type { MaintenanceRequest } from '@/hooks/maintenance-requests';

import { formatDate } from '@repo/utils';

type MaintenanceRequestCardProps = {
  request: MaintenanceRequest;
  onPress?: (request: MaintenanceRequest) => void;
};

export default function MaintenanceRequestCard({
  request,
  onPress
}: MaintenanceRequestCardProps) {
  const statusStyles = useMaintenanceRequestStatusStyles();
  const urgencyStyles = useMaintenanceRequestUrgencyStyles();
  const status = statusStyles[request.status];
  const urgency = urgencyStyles[request.urgency];
  const categoryLabel =
    MAINTENANCE_CATEGORIES.find((c) => c.value === request.category)?.label ?? request.category;
  const urgencyLabel =
    MAINTENANCE_URGENCY.find((u) => u.value === request.urgency)?.label ?? request.urgency;

  return (
    <PressableFeedback
      onPress={() => onPress?.(request)}
      className='rounded-3xl shadow-none overflow-hidden'
    >
      <PressableFeedback.Highlight />
      <Card className='border border-border'>
        <Card.Header>
          <View className="flex-row items-center justify-between">
            <Text
              className="text-foreground font-interSemiBold text-base"
              numberOfLines={1}
            >
              {request.title}
            </Text>
            <Chip
              variant="soft"
              size="sm"
              animation="disable-all"
              style={{ backgroundColor: status.backgroundColor }}
            >
              <Chip.Label
                style={{ color: status.textColor }}
                className="text-xs font-interMedium"
              >
                {request.status}
              </Chip.Label>
            </Chip>
          </View>
        </Card.Header>
        <Card.Body className="gap-2">
          {/* Category */}
          <Text className="text-muted text-sm font-inter">
            Category: {categoryLabel}
          </Text>

          {/* Submitted Date and Urgency Level*/}
          <View className='flex-row items-center justify-between'>
            <Text className="text-textSecondary text-xs font-inter mt-1">
              Reported {formatDate(request.created_at, "medium")}
            </Text>

            <Chip
              variant="soft"
              size="sm"
              animation="disable-all"
              style={{ backgroundColor: urgency.backgroundColor }}
            >
              <Chip.Label
                style={{ color: urgency.textColor }}
                className="text-xs font-interMedium"
              >
                {urgencyLabel} Urgency
              </Chip.Label>
            </Chip>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
