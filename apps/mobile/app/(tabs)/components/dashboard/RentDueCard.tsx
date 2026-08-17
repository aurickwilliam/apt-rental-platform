import { View, Text, TouchableOpacity } from "react-native";

import { IconBuilding, IconAlertTriangle } from "@tabler/icons-react-native";

import { formatDate, formatPesoDisplay } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";

interface RentDueCardProps {
  tenantName: string;
  propertyName: string;
  dueDate: string;
  amount: number;
  isOverdue?: boolean;
  onPress: () => void;
}

export default function RentDueCard({
  tenantName,
  propertyName,
  dueDate,
  amount,
  isOverdue = false,
  onPress
}: RentDueCardProps){
  const { colors } = useColors();
  const formattedAmount = formatPesoDisplay(amount);
  const formattedDate = formatDate(dueDate, "medium") || "No due date";

  return (
    <TouchableOpacity
      className="bg-surface rounded-3xl p-4 border border-border"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row gap-1 items-center">
        <IconBuilding
          size={22}
          color={colors.gray500}
        />
        <Text className="text-foreground font-interSemiBold flex-1">
          {propertyName}
        </Text>
        {isOverdue && (
          <View className="flex-row items-center gap-1">
            <IconAlertTriangle size={14} color={colors.danger} />
            <Text className="text-danger font-interMedium text-xs">
              Overdue
            </Text>
          </View>
        )}
      </View>

      <Text className="text-muted font-interMedium mt-1">
        {tenantName}
      </Text>
      <View className="flex-row justify-between items-center mt-2">
        <Text className={`text-foreground font-inter text-sm ${isOverdue ? "text-danger" : ""}`}>
          Due: {formattedDate}
        </Text>
        <Text className={`text-base font-interSemiBold ${isOverdue ? "text-danger" : "text-accent"}`}>
          ₱ {formattedAmount}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
