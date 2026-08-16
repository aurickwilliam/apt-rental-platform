import { View } from 'react-native';
import { Avatar, Button, Toast } from 'heroui-native';
import type { ToastComponentProps, ToastManager, ToastVariant } from 'heroui-native';
import { IconChevronRight } from '@tabler/icons-react-native';

import { getInitials } from '@repo/utils';

import { getNotificationTypeIcon, useNotificationTypeColor } from '@/hooks/notifications/notificationVisuals';
import { useColors } from '@/hooks/useTheme';

import type { NotificationRow, NotificationType } from '@/service/notificationService';

const TOAST_VARIANT_BY_TYPE: Record<NotificationType, ToastVariant> = {
  payment: 'success',
  message: 'accent',
  maintenance: 'warning',
  apartment: 'accent',
  system: 'default',
};

const TOAST_DURATION_MS = 4000;

export interface NotificationToastOptions {
  row: Pick<NotificationRow, 'type' | 'title' | 'data'> & {
    message?: string | null;
  };
  /** Sender avatar URL for message toasts (read from data.senderAvatarUrl). */
  avatarUrl?: string | null;
  /** Called when the chevron action is pressed. */
  onOpen: () => void;
}

/**
 * Shows an in-app notification toast with a custom layout: sender avatar
 * (message type) or type icon, title/description, and a muted chevron action.
 * Shared by the realtime banner hook and the dev toast playground.
 */
export function showNotificationToast(
  toast: ToastManager,
  { row, avatarUrl, onOpen }: NotificationToastOptions,
): void {
  toast.show({
    duration: TOAST_DURATION_MS,
    component: (props) => (
      <NotificationToastContent
        {...props}
        row={row}
        avatarUrl={avatarUrl}
        onOpen={onOpen}
      />
    ),
  });
}

interface NotificationToastContentProps
  extends ToastComponentProps,
    NotificationToastOptions {}

function NotificationToastContent({
  row,
  avatarUrl,
  onOpen,
  ...toastProps
}: NotificationToastContentProps) {
  const { colors } = useColors();
  const { getColor } = useNotificationTypeColor();

  const type = row.type as NotificationType;
  const isMessage = type === 'message';
  const Icon = isMessage ? null : getNotificationTypeIcon(type);
  const iconColor = getColor(type);

  // Muted chevron, except payment/maintenance which tint it with their
  // semantic color (green/yellow).
  const chevronColor =
    type === 'payment'
      ? colors.success
      : type === 'maintenance'
        ? colors.warning
        : colors.gray500;

  return (
    <Toast
      id={toastProps.id}
      variant={TOAST_VARIANT_BY_TYPE[type]}
      className="flex-row gap-3"
      hide={toastProps.hide}
      show={toastProps.show}
      index={toastProps.index}
      total={toastProps.total}
      heights={toastProps.heights}
      maxVisibleToasts={toastProps.maxVisibleToasts}
    >
      {isMessage ? (
        <Avatar size="sm" className="self-center border border-border">
          {avatarUrl ? <Avatar.Image source={{ uri: avatarUrl }} /> : null}
          <Avatar.Fallback delayMs={avatarUrl ? 200 : 0}>
            {getInitials(row.title) || '?'}
          </Avatar.Fallback>
        </Avatar>
      ) : (
        <View className="self-center justify-center">
          {Icon ? <Icon size={20} color={iconColor} /> : null}
        </View>
      )}

      <View className="flex-1">
        <Toast.Title>{row.title}</Toast.Title>
        {row.message ? <Toast.Description>{row.message}</Toast.Description> : null}
      </View>

      <Button
        variant="ghost"
        isIconOnly
        aria-label="View"
        onPress={onOpen}
        className="self-center"
      >
        <IconChevronRight size={18} color={chevronColor} />
      </Button>
    </Toast>
  );
}