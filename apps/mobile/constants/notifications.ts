import type { TranslationKey } from '@repo/i18n';

import type { NotificationPreferenceType } from '@/service/notifications/notificationService';

/** Display labels only; the stored preference keys stay the English type names. */
export const NOTIFICATION_TYPE_LABELS: {
  type: NotificationPreferenceType;
  labelKey: TranslationKey;
}[] = [
  { type: 'payment', labelKey: 'settings.notifications.type.payment' },
  { type: 'message', labelKey: 'settings.notifications.type.message' },
  { type: 'maintenance', labelKey: 'settings.notifications.type.maintenance' },
  { type: 'apartment', labelKey: 'settings.notifications.type.apartment' },
  { type: 'system', labelKey: 'settings.notifications.type.system' },
];
