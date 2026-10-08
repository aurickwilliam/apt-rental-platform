import { Text, View } from "react-native";

import { Avatar, Chip } from "heroui-native";
import { IconMail, IconMapPin } from "@tabler/icons-react-native";

import { getInitials } from "@repo/utils";

import { statusChipSurface, type StatusChipStyle } from "@/hooks/useStatusChipStyles";
import { useColors } from "@/hooks/useTheme";

interface TenantSummaryCardProps {
  name: string;
  email: string | null;
  city: string;
  avatarUrl: string | null;
  status: string;
  statusStyle: StatusChipStyle;
}

/** Who applied, where they are from, and the current application status. */
export default function TenantSummaryCard({
  name,
  email,
  city,
  avatarUrl,
  status,
  statusStyle,
}: TenantSummaryCardProps) {
  const { colors } = useColors();

  return (
    <View className="bg-surface border border-border rounded-3xl p-4 flex-row items-center gap-3">
      <Avatar size="lg" className="border border-border">
        <Avatar.Image source={{ uri: avatarUrl ?? "" }} />
        <Avatar.Fallback delayMs={200}>{getInitials(name)}</Avatar.Fallback>
      </Avatar>

      <View className="flex-1 min-w-0 gap-0.5">
        <Text
          className="text-foreground text-base font-nunitoSemiBold"
          numberOfLines={1}
        >
          {name}
        </Text>

        <View className="flex-row items-center gap-1">
          <IconMail size={13} color={colors.gray500} />
          <Text className="text-gray-500 text-xs font-inter" numberOfLines={1}>
            {email}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <IconMapPin size={13} color={colors.gray500} />
          <Text className="text-gray-500 text-xs font-inter">{city}</Text>
        </View>
      </View>

      <Chip size="sm" variant="soft" style={statusChipSurface(statusStyle)}>
        <Chip.Label
          className="font-nunitoSemiBold"
          style={{ color: statusStyle.textColor }}
        >
          {status}
        </Chip.Label>
      </Chip>
    </View>
  );
}
