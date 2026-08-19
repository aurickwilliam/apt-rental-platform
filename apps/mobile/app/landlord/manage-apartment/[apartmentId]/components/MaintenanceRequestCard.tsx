import { View, Text } from "react-native";

import { IconHammer, IconTool } from "@tabler/icons-react-native";

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
          <View className="flex-row items-center gap-2 flex-1">
            <IconTool size={20} color={colors.primary} />
            <Text
              className="text-foreground font-interSemiBold text-base flex-1"
              numberOfLines={1}
            >
              Maintenance Request
            </Text>
          </View>

          <Chip
            variant="soft"
            size="md"
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

      <Card.Body className="pt-3 gap-2">
        <View>
          <Text className="text-muted text-xs font-inter">
            Issue Name
          </Text>

          <Text
            className="text-foreground text-base font-interMedium"
            numberOfLines={2}
          >
            {issueName}
          </Text>
        </View>

        <View className="flex-row items-end justify-between gap-3">
          <View>
            <Text className="text-muted text-xs font-inter">
              Reported Date
            </Text>

            <Text className="text-foreground text-sm font-interMedium">
              {reportedDate}
            </Text>
          </View>

          <Button 
            size={"sm"}
            onPress={onUpdatePress}
          >
            <IconHammer size={16} color={colors.white} />
            <Button.Label>Update Maintenance</Button.Label>
          </Button>
        </View>
      </Card.Body>
    </Card>
  );
}