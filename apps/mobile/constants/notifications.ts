import type { NotificationPreferenceType } from '@/service/notificationService';

export const NOTIFICATION_TYPE_LABELS: { type: NotificationPreferenceType; label: string }[] = [
  { type: 'payment', label: 'Payments' },
  { type: 'message', label: 'Messages' },
  { type: 'maintenance', label: 'Maintenance' },
  { type: 'apartment', label: 'Apartments' },
  { type: 'system', label: 'System' },
];
