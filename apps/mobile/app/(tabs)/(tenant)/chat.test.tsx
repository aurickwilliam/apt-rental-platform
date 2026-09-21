import { sortUnreadFirst } from './chat';

import type { ConversationWithMeta } from '@/service/chat/conversationService';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function SwipeableStub({ children }: { children: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  return {
    __esModule: true,
    default: SwipeableStub,
  };
});

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function MockIcon() {
    return React.createElement(View);
  }
  return { IconCheck: MockIcon };
});

jest.mock('components/layout/ScreenWrapper', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function ScreenWrapperStub({ children }: { children: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  return {
    __esModule: true,
    default: ScreenWrapperStub,
  };
});

jest.mock('@/app/(tabs)/components/CustomTabBar', () => ({
  FLOATING_TAB_BAR_HEIGHT: 0,
  FLOATING_TAB_BAR_BOTTOM_OFFSET: 0,
}));

jest.mock('constants/images', () => ({
  EMPTY_STATE_IMAGES: { emptyMessage: null },
}));

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { primary: '#376BF5', gray500: '#6C757D' },
    isDark: false,
  }),
}));

jest.mock('@/hooks/chat', () => ({
  useConversations: () => ({
    conversations: [],
    loading: false,
    refreshing: false,
    error: null,
    refetch: jest.fn(),
    markConversationRead: jest.fn(),
  }),
}));

jest.mock('@/hooks/tenancy', () => ({
  useTenancy: () => ({ tenancy: null, refreshing: false, refetch: jest.fn() }),
}));

// heroui-native ships untranspiled ESM that Jest cannot parse — stub the used
// primitives. This file only exercises the sort helper, so inert stubs suffice.
jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');

  const Passthrough = function Passthrough({
    children,
  }: {
    children?: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };

  const ButtonMock = function ButtonMock({
    children,
  }: {
    children?: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  ButtonMock.Label = Passthrough;

  const SearchFieldMock = function SearchFieldMock({
    children,
  }: {
    children?: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  SearchFieldMock.Group = Passthrough;
  SearchFieldMock.SearchIcon = function SearchIcon() {
    return null;
  };
  SearchFieldMock.Input = function SearchInput() {
    return null;
  };
  SearchFieldMock.ClearButton = function ClearButton() {
    return null;
  };

  return {
    Button: ButtonMock,
    SearchField: SearchFieldMock,
    Separator: () => null,
    Spinner: () => null,
  };
});

function makeConversation(
  conversationKey: string,
  unreadCount: number
): ConversationWithMeta {
  return {
    conversation_key: conversationKey,
    other_user_id: `user-${conversationKey}`,
    other_user_name: `User ${conversationKey}`,
    other_user_avatar: null,
    other_user_phone: null,
    apartment_id: `apt-${conversationKey}`,
    apartment_name: `Apartment ${conversationKey}`,
    last_message: 'hello',
    last_message_type: 'text',
    last_message_time: '2026-01-01T00:00:00Z',
    unread_count: unreadCount,
    last_sender_id: null,
    last_sender_is_me: false,
    conversation_type: 'inquiry',
  };
}

describe('sortUnreadFirst', () => {
  it('moves unread conversations first, preserving order within groups', () => {
    const input = [
      makeConversation('read-1', 0),
      makeConversation('unread-1', 2),
      makeConversation('read-2', 0),
      makeConversation('unread-2', 1),
    ];

    expect(sortUnreadFirst(input).map((c) => c.conversation_key)).toEqual([
      'unread-1',
      'unread-2',
      'read-1',
      'read-2',
    ]);
  });

  it('keeps the existing order when nothing is unread', () => {
    const input = [makeConversation('a', 0), makeConversation('b', 0)];

    expect(sortUnreadFirst(input).map((c) => c.conversation_key)).toEqual([
      'a',
      'b',
    ]);
  });

  it('handles an empty list', () => {
    expect(sortUnreadFirst([])).toEqual([]);
  });
});
