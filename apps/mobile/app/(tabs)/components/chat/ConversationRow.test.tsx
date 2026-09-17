import { fireEvent, render, screen } from '@testing-library/react-native';

import ConversationRow from './ConversationRow';

import type { ConversationWithMeta } from '@/service/chat/conversationService';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { gray500: '#6C757D' },
    isDark: false,
  }),
}));

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function MockIcon() {
    return React.createElement(View);
  }
  return {
    IconCheck: MockIcon,
    IconPhoto: MockIcon,
    IconGif: MockIcon,
    IconPlayerPlayFilled: MockIcon,
  };
});

// heroui-native ships untranspiled ESM that Jest cannot parse — stub the used
// primitives with real Pressable/View hosts so press and a11y queries work.
jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text, View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  function ButtonLabel({ children }: { children: React.ReactNode }) {
    return React.createElement(Text, null, children);
  }

  function ButtonMock({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return React.createElement(Pressable, props, children);
  }
  ButtonMock.Label = ButtonLabel;

  function PressableFeedbackMock({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return React.createElement(Pressable, props, children);
  }
  PressableFeedbackMock.Highlight = function Highlight() {
    return null;
  };

  function AvatarMock({ children }: { children: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  AvatarMock.Image = function AvatarImage() {
    return null;
  };
  AvatarMock.Fallback = function AvatarFallback({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };

  return {
    Avatar: AvatarMock,
    Button: ButtonMock,
    PressableFeedback: PressableFeedbackMock,
  };
});

// Render left actions inline so the Mark read button is tappable in tests.
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function SwipeableStub({
    children,
    renderLeftActions,
  }: {
    children: React.ReactNode;
    renderLeftActions?: () => React.ReactNode;
  }) {
    return React.createElement(
      View,
      null,
      renderLeftActions?.(),
      children
    );
  }
  return {
    __esModule: true,
    default: SwipeableStub,
  };
});

function makeConversation(unreadCount: number): ConversationWithMeta {
  return {
    conversation_key: 'user-9:apt-9',
    other_user_id: 'user-9',
    other_user_name: 'Ben Cruz',
    other_user_avatar: null,
    other_user_phone: null,
    apartment_id: 'apt-9',
    apartment_name: 'Harbor View',
    last_message: 'Is parking included?',
    last_message_type: 'text',
    last_message_time: '2026-01-01T00:00:00Z',
    unread_count: unreadCount,
    last_sender_id: null,
    last_sender_is_me: false,
    conversation_type: 'inquiry',
  };
}

describe('ConversationRow', () => {
  it('opens the conversation on press', () => {
    const onOpen = jest.fn();
    render(
      <ConversationRow
        conversation={makeConversation(0)}
        onOpen={onOpen}
        onMarkRead={jest.fn()}
      />
    );

    fireEvent.press(
      screen.getByLabelText('Chat with Ben Cruz about Harbor View')
    );

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('reveals Mark read for unread rows and marks read on press', () => {
    const onMarkRead = jest.fn();
    render(
      <ConversationRow
        conversation={makeConversation(2)}
        onOpen={jest.fn()}
        onMarkRead={onMarkRead}
      />
    );

    fireEvent.press(screen.getByText('Mark read'));

    expect(onMarkRead).toHaveBeenCalledTimes(1);
    expect(onMarkRead).toHaveBeenCalledWith('user-9:apt-9');
  });

  it('renders no Mark read action for read rows', () => {
    render(
      <ConversationRow
        conversation={makeConversation(0)}
        onOpen={jest.fn()}
        onMarkRead={jest.fn()}
      />
    );

    expect(screen.queryByText('Mark read')).toBeNull();
  });
});
