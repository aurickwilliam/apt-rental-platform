import { View, Text } from "react-native";
import { useRouter, type Href } from "expo-router";

import { IconBell } from "@tabler/icons-react-native";

import { Button } from "heroui-native";

import { useColors } from "@/hooks/useTheme";
import { useUnreadNotificationCount } from "@/hooks/notifications";

interface NotificationBellButtonProps {
  route: Href;
  // "onImage": white bell on a dark translucent circle, for photo headers.
  tone?: "default" | "onImage";
}

const ON_IMAGE_ICON_COLOR = "#FFFFFF";

export default function NotificationBellButton({ route, tone = "default" }: NotificationBellButtonProps) {
  const router = useRouter();
  const { colors } = useColors();
  const { unreadCount } = useUnreadNotificationCount();

  return (
    <Button
      onPress={() => router.push(route)}
      variant="ghost"
      isIconOnly
      className={tone === "onImage" ? "bg-black/35" : undefined}
      accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
    >
      <View className="relative">
        <IconBell size={26} color={tone === "onImage" ? ON_IMAGE_ICON_COLOR : colors.gray500} />

        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 min-w-5.5 h-5.5 px-1 rounded-full bg-danger items-center justify-center border-2 border-background">
            <Text className="text-white text-[10px] font-nunitoSemiBold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </Button>
  );
}
