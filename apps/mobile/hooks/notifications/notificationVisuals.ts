import type { Icon } from "@tabler/icons-react-native";
import {
  IconCashBanknote,
  IconHammer,
  IconHome,
  IconInfoCircle,
  IconMessage,
  IconUserCog,
} from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

import type { NotificationType } from "@/service/notificationService";

const iconMap: Record<NotificationType, Icon> = {
  payment: IconCashBanknote,
  message: IconMessage,
  maintenance: IconHammer,
  apartment: IconHome,
  system: IconUserCog,
};

const FALLBACK_ICON: Icon = IconInfoCircle;

export function getNotificationTypeIcon(type: NotificationType): Icon {
  return iconMap[type] ?? FALLBACK_ICON;
}

export function useNotificationTypeColor() {
  const { colors } = useColors();

  const colorMap: Record<NotificationType, string> = {
    payment: colors.success,
    message: colors.primary,
    maintenance: colors.warning,
    apartment: colors.primary,
    system: colors.gray500,
  };

  return {
    getColor: (type: NotificationType): string => colorMap[type] ?? colors.gray500,
  };
}