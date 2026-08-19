import { View, Text } from "react-native";

import { IconHammer } from "@tabler/icons-react-native";

import { Button, Card, Chip } from "heroui-native";

import { useColors } from "hooks/useTheme";

interface MaintenanceRequestCardProps {
  issueName: string;
  reportedDate: string;
  onUpdatePress: () => void;
}

export default function MaintenanceRequestCard({
  issueName,
  reportedDate,
  onUpdatePress,
}: MaintenanceRequestCardProps) {
  const { colors } = useColors();

  return (
    <Card className="border border-border shadow-none rounded-3xl">
      <Card.Header>
        <View className="flex-row items-center justify-between gap-3">
          <Text
            className="text-foreground font-interSemiBold text-base flex-1"
            numberOfLines={1}
          >
            Maintenance Request
          </Text>

          <Chip
            variant="soft"
            size="sm"
            animation="disable-all"
            style={{ backgroundColor: colors.warningLight }}
          >
            <Chip.Label
              style={{ color: colors.warning }}
              className="text-xs font-interMedium"
            >
              Pending
            </Chip.Label>
          </Chip>
        </View>
      </Card.Header>

      <Card.Body className="pt-0 gap-2">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-muted text-xs font-inter">Issue</Text>
          <Text
            className="text-foreground text-sm font-interMedium flex-1 text-right"
            numberOfLines={2}
          >
            {issueName}
          </Text>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Text className="text-muted text-xs font-inter">Reported</Text>
          <Text className="text-foreground text-sm font-interMedium">
            {reportedDate}
          </Text>
        </View>

        <Button size="sm" className="mt-1 self-start" onPress={onUpdatePress}>
          <IconHammer size={16} color="#4B5563" />
          <Button.Label>Update Maintenance</Button.Label>
        </Button>
      </Card.Body>
    </Card>
  );
}