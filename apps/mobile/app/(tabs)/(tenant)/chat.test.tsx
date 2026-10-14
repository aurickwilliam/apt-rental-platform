import { fireEvent, render, screen } from '@testing-library/react-native';

import Chat from './chat';

import type { ConversationListItem } from '@/service/chat/conversationList';
import type { ConversationWithMeta } from '@/service/chat/conversationService';
import { DEFAULT_CONVERSATION_PREFERENCES } from '@/service/chat/conversationPreferences';

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

jest.mock('react-native-gesture-handler', () => {
  const { FlatList, RefreshControl } = jest.requireActual<typeof import('react-native')>('react-native');
  return { FlatList, RefreshControl };
});

jest.mock('components/layout/ScreenWrapper', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function ScreenWrapperStub({ children }: { children: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  return { __esModule: true, default: ScreenWrapperStub };
});

// Renders each row as text describing its kind, so the list order is testable.
jest.mock('@/app/(tabs)/components/chat/ConversationListRow', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  function RowStub({
    item,
    onStartLandlordChat,
  }: {
    item: ConversationListItem;
    onStartLandlordChat?: (item: ConversationListItem) => void;
  }) {
    switch (item.kind) {
      case 'conversation':
        return React.createElement(
          Text,
          null,
          `row:${item.conversation.other_user_name}${item.isPinLocked ? ':locked' : ''}`
        );
      case 'landlord-shortcut':
        return React.createElement(
          Pressable,
          { accessibilityLabel: `shortcut:${item.landlordName}`, onPress: () => onStartLandlordChat?.(item) },
          React.createElement(Text, null, 'shortcut')
        );
      case 'separator':
        return React.createElement(Text, null, 'separator');
      case 'archived':
        return React.createElement(Text, null, `archived:${item.count}`);
    }
  }
  return { __esModule: true, default: RowStub };
});

jest.mock('@/app/(tabs)/components/chat/ConversationActionOverlays', () => ({
  __esModule: true,
  default: () => null,
}));

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
    updatePreferences: jest.fn(),
    setBlocked: jest.fn(),
  }),
  useConversationRowActions: () => ({
    rowHandlers: { openMore: jest.fn(), togglePin: jest.fn(), toggleArchive: jest.fn() },
    overlays: {},
  }),
}));

jest.mock('@/hooks/tenancy', () => ({
  useTenancy: () => ({ tenancy: mockTenancy, refetch: jest.fn().mockResolvedValue(undefined) }),
}));

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
    ...DEFAULT_CONVERSATION_PREFERENCES,
    ...overrides,
  };
}

const activeTenancy = {
  landlord: { id: LANDLORD_ID, first_name: 'Lara', last_name: 'Cruz', avatar_url: null },
  apartment: { id: APARTMENT_ID, name: 'Sunrise Loft' },
};

function renderedRows(): string[] {
  return screen
    .getAllByText(/^(row:|shortcut|separator|archived:)/)
    .map((node) => String(node.props.children));
}

beforeEach(() => {
  mockPush.mockClear();
  mockConversations = [];
  mockTenancy = null;
});

describe('tenant Messages tab', () => {
  it('pins the current landlord on top, then a separator, with no section headers', () => {
    mockTenancy = activeTenancy;
    mockConversations = [
      makeConversation({ conversation_key: 'other', other_user_name: 'Other Landlord' }),
      makeConversation({
        conversation_key: 'landlord-chat',
        other_user_id: LANDLORD_ID,
        other_user_name: 'Lara Cruz',
        apartment_id: APARTMENT_ID,
      }),
    ];

    render(<Chat />);

    expect(renderedRows()).toEqual(['row:Lara Cruz:locked', 'separator', 'row:Other Landlord']);
    expect(screen.queryByText('Current Landlord')).toBeNull();
  });

  it('puts user-pinned chats after the landlord and archived chats behind a row', () => {
    mockTenancy = activeTenancy;
    mockConversations = [
      makeConversation({ conversation_key: 'a', other_user_name: 'Archived One', is_archived: true }),
      makeConversation({ conversation_key: 'p', other_user_name: 'Pinned One', is_pinned: true, pinned_at: '2026-01-02T00:00:00Z' }),
      makeConversation({
        conversation_key: 'landlord-chat',
        other_user_id: LANDLORD_ID,
        other_user_name: 'Lara Cruz',
        apartment_id: APARTMENT_ID,
      }),
      makeConversation({ conversation_key: 'o', other_user_name: 'Other' }),
    ];

    render(<Chat />);

    expect(renderedRows()).toEqual([
      'row:Lara Cruz:locked',
      'row:Pinned One',
      'separator',
      'row:Other',
      'archived:1',
    ]);
  });

  it('offers a pinned shortcut to message the current landlord before any chat exists', () => {
    mockTenancy = activeTenancy;

    render(<Chat />);

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

  it('shows the empty state with no tenancy and no conversations', () => {
    render(<Chat />);

    expect(screen.getByText('No Messages Yet')).toBeTruthy();
  });
});
