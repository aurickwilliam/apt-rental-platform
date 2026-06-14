import { View, Text } from "react-native";

import { Hammer } from 'lucide-react-native';

import { Button } from "heroui-native";

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
  return (
    <View className="w-full bg-surface border border-border p-4 rounded-xl">
      <View className="flex-row items-center justify-between">
        <Text className="text-foreground font-interSemiBold text-lg">
          Maintenance Request
        </Text>

        <View className="flex-row items-center gap-2 bg-darkerWhite py-2 px-3 rounded-full">
          <View className="rounded-full bg-yellowish-200 w-3 h-3" />

          <Text className="text-foreground text-sm font-inter">
            Pending
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <Text className="text-muted text-base font-inter">
          Name/Issue:
        </Text>
        <Text className="text-foreground text-base font-interMedium">
          {issueName}
        </Text>
      </View>

      <View className="mt-3">
        <Text className="text-muted text-base font-inter">
          Reported Date:
        </Text>
        <Text className="text-foreground text-base font-interMedium">
          {reportedDate}
        </Text>
      </View>

      <View className="mt-3">
        <Button size="sm" onPress={onUpdatePress}>
          <Hammer size={16} color="#4B5563" />
          <Button.Label>
            Update Maintenance
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
