import { View, Text } from "react-native";
import { useRouter } from "expo-router";

import { IconBell } from "@tabler/icons-react-native";

import { Button } from "heroui-native";

import { useColors } from "@/hooks/useTheme";
import { useUnreadNotificationCount } from "@/hooks/notifications";

interface NotificationBellButtonProps {
  route: string;
}

export default function NotificationBellButton({ route }: NotificationBellButtonProps) {
  const router = useRouter();
  const { colors } = useColors();
  const { unreadCount } = useUnreadNotificationCount();

  return (
    <Button onPress={() => router.push(route)} variant="ghost" isIconOnly>
      <View className="relative">
        <IconBell size={26} color={colors.gray500} />

        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full bg-accent items-center justify-center border-2 border-background">
            <Text className="text-white text-[10px] font-nunitoSemiBold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Button>
  );
}
