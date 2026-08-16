import { ScrollView, Text, View } from 'react-native';
import { Button, useToast } from 'heroui-native';

import { showNotificationToast } from '@/components/display/NotificationToast';

import type { NotificationRow } from '@/service/notificationService';

type MockRow = Pick<NotificationRow, 'type' | 'title' | 'data'> & {
  message?: string | null;
};

const MOCK_CONVERSATION_KEY =
  'chat:none:11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222';
const MOCK_APARTMENT_ID = '33333333-3333-4333-8333-333333333333';
const MOCK_PAYMENT_ID = '44444444-4444-4444-8444-444444444444';
const MOCK_MAINTENANCE_ID = '55555555-5555-4555-8555-555555555555';

const MOCK_AVATAR_URL = 'https://i.pravatar.cc/150?img=12';

interface MockToast {
  label: string;
  row: MockRow;
  avatarUrl?: string | null;
}

const MOCK_TOASTS: MockToast[] = [
  {
    label: 'Message — with sender avatar',
    row: {
      type: 'message',
      title: 'Juan Dela Cruz',
      message: 'Hello! Is the unit still available?',
      data: { screen: 'chat', conversationKey: MOCK_CONVERSATION_KEY },
    },
    avatarUrl: MOCK_AVATAR_URL,
  },
  {
    label: 'Message — no avatar (initials)',
    row: {
      type: 'message',
      title: 'Maria Santos',
      message: 'Sent an image',
      data: { screen: 'chat', conversationKey: MOCK_CONVERSATION_KEY },
    },
  },
  {
    label: 'Message — no description',
    row: {
      type: 'message',
      title: 'Pedro Reyes',
      data: { screen: 'chat', conversationKey: MOCK_CONVERSATION_KEY },
    },
  },
  {
    label: 'Payment — received',
    row: {
      type: 'payment',
      title: 'Payment Received',
      message: 'A tenant paid ₱12,500.00.',
      data: { screen: 'payments', paymentId: MOCK_PAYMENT_ID },
    },
  },
  {
    label: 'Maintenance — new request',
    row: {
      type: 'maintenance',
      title: 'New Maintenance Request',
      message: 'Leaking faucet (high priority).',
      data: { screen: 'maintenance', maintenanceId: MOCK_MAINTENANCE_ID },
    },
  },
  {
    label: 'Apartment — new listing',
    row: {
      type: 'apartment',
      title: 'New Apartment Listed',
      message: 'A 2-bedroom unit in Caloocan matches your preferences.',
      data: { screen: 'apartment', apartmentId: MOCK_APARTMENT_ID },
    },
  },
  {
    label: 'System — generic',
    row: {
      type: 'system',
      title: 'Account Verified',
      message: 'Your account has been verified successfully.',
      data: {},
    },
  },
];

export default function NotificationToastDevScreen() {
  const { toast } = useToast();

  return (
    <ScrollView className="flex-1 bg-white pt-16 px-4">
      <Text className="text-xl font-interSemiBold text-foreground">
        Notification Toasts
      </Text>
      <Text className="text-sm text-muted font-inter mt-1 mb-4">
        Press a button to preview the in-app notification toast.
      </Text>

      {MOCK_TOASTS.map(({ label, row, avatarUrl }) => (
        <Button
          key={label}
          className="mb-3"
          onPress={() =>
            showNotificationToast(toast, { row, avatarUrl, onOpen: () => {} })
          }
        >
          {label}
        </Button>
      ))}

      <View className="h-12" />
    </ScrollView>
  );
}