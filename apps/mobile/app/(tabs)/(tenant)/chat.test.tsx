import { fireEvent, render, screen } from '@testing-library/react-native';

import Chat from './chat';

import type { ConversationWithMeta } from '@/service/chat/conversationService';

const MY_ID = 'tenant-1';
const LANDLORD_ID = 'landlord-1';
const APARTMENT_ID = 'apt-1';

const mockPush = jest.fn();
let mockConversations: ConversationWithMeta[] = [];
let mockTenancy: unknown = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('components/layout/ScreenWrapper', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function ScreenWrapperStub({ children }: { children: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  return { __esModule: true, default: ScreenWrapperStub };
});

jest.mock('@/app/(tabs)/components/chat/ConversationRow', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  function ConversationRowStub({ conversation }: { conversation: ConversationWithMeta }) {
    return React.createElement(Text, null, `row:${conversation.other_user_name}`);
  }
  return { __esModule: true, default: ConversationRowStub };
});

jest.mock('@/app/(tabs)/components/chat/MessageCard', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  function MessageCardStub({ name, lastMessage, onPress }: { name: string; lastMessage: string; onPress: () => void }) {
    return React.createElement(
      Pressable,
      { onPress, accessibilityRole: 'button', accessibilityLabel: `shortcut:${name}` },
      React.createElement(Text, null, lastMessage)
    );
  }
  return { __esModule: true, default: MessageCardStub };
});

jest.mock('@/app/(tabs)/components/chat/ConversationListHeader', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  function HeaderStub() {
    return React.createElement(Text, null, 'Messages');
  }
  return { __esModule: true, default: HeaderStub };
});

jest.mock('@/app/(tabs)/components/chat/ConversationListState', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  function StateStub(props: { variant: string; title?: string }) {
    return React.createElement(Text, null, props.title ?? props.variant);
  }
  return { __esModule: true, default: StateStub };
});

jest.mock('@/app/(tabs)/components/CustomTabBar', () => ({
  FLOATING_TAB_BAR_HEIGHT: 0,
  FLOATING_TAB_BAR_BOTTOM_OFFSET: 0,
}));

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({ colors: { primary: '#376BF5', gray500: '#6C757D' }, isDark: false }),
}));

jest.mock('@/hooks/auth', () => ({
  useCurrentUserId: () => MY_ID,
}));

jest.mock('@/hooks/chat', () => ({
  useConversations: () => ({
    conversations: mockConversations,
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    markConversationRead: jest.fn(),
  }),
}));

jest.mock('@/hooks/tenancy', () => ({
  useTenancy: () => ({ tenancy: mockTenancy, refetch: jest.fn().mockResolvedValue(undefined) }),
}));

// heroui-native ships untranspiled ESM that Jest cannot parse.
jest.mock('heroui-native', () => ({ Separator: () => null }));

jest.mock('@repo/supabase', () => ({ supabase: {} }));

function makeConversation(overrides: Partial<ConversationWithMeta>): ConversationWithMeta {
  return {
    conversation_key: 'key',
    other_user_id: 'someone',
    other_user_name: 'Someone',
    other_user_avatar: null,
    other_user_phone: null,
    apartment_id: 'apt-x',
    apartment_name: 'Somewhere',
    last_message: 'hello',
    last_message_type: 'text',
    last_message_time: '2026-01-01T00:00:00Z',
    unread_count: 0,
    last_sender_id: null,
    last_sender_is_me: false,
    conversation_type: 'inquiry',
    ...overrides,
  };
}

const activeTenancy = {
  landlord: { id: LANDLORD_ID, first_name: 'Lara', last_name: 'Cruz', avatar_url: null },
  apartment: { id: APARTMENT_ID, name: 'Sunrise Loft' },
};

beforeEach(() => {
  mockPush.mockClear();
  mockConversations = [];
  mockTenancy = null;
});

describe('tenant Messages tab', () => {
  it('offers a shortcut to message the current landlord before any chat exists', () => {
    mockTenancy = activeTenancy;

    render(<Chat />);

    expect(screen.getByText('Current Landlord')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('shortcut:Lara Cruz'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/chat/[conversationId]',
      params: expect.objectContaining({
        otherUserId: LANDLORD_ID,
        apartmentId: APARTMENT_ID,
        apartmentTitle: 'Sunrise Loft',
      }),
    });
    expect(JSON.stringify(mockPush.mock.calls[0][0])).not.toContain('Phone');
  });

  it('shows the real conversation instead of the shortcut once one exists', () => {
    mockTenancy = activeTenancy;
    mockConversations = [
      makeConversation({
        conversation_key: 'landlord-chat',
        other_user_id: LANDLORD_ID,
        other_user_name: 'Lara Cruz',
        apartment_id: APARTMENT_ID,
      }),
      makeConversation({ conversation_key: 'other-chat', other_user_name: 'Other Landlord' }),
    ];

    render(<Chat />);

    expect(screen.getByText('row:Lara Cruz')).toBeTruthy();
    expect(screen.queryByLabelText('shortcut:Lara Cruz')).toBeNull();
    expect(screen.getByText('Other Conversations (1)')).toBeTruthy();
  });

  it('shows the empty state with no tenancy and no conversations', () => {
    render(<Chat />);

    expect(screen.getByText('No Messages Yet')).toBeTruthy();
  });
});
