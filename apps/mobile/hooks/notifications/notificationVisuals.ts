import type { Icon } from "@tabler/icons-react-native";
import {
  IconCalendarExclamation,
  IconCashBanknote,
  IconHammer,
  IconHome,
  IconInfoCircle,
  IconMessage,
  IconUserCog,
} from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

import type { NotificationType } from "@/service/notifications/notificationService";

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

export const RENT_DUE_TITLES = new Set([
  "Rent Due Soon",
  "Rent Due Today",
  "Rent Past Due",
  "Tenant Rent Due Soon",
  "Tenant Rent Due Today",
  "Tenant Rent Overdue",
]);

export function isRentDueNotification(title?: string | null): boolean {
  return !!title && RENT_DUE_TITLES.has(title);
}

export const RENT_DUE_ICON = IconCalendarExclamation;

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