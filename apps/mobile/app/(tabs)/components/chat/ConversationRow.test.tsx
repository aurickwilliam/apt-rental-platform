import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ConversationRow from './ConversationRow';

import type { ConversationWithMeta } from '@/service/chat/conversationService';
import { DEFAULT_CONVERSATION_PREFERENCES } from '@/service/chat/conversationPreferences';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: {
      gray500: '#6C757D',
      actionMore: '#6B7280',
      actionPin: '#D97706',
      actionArchive: '#7C3AED',
    },
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
    IconArchive: MockIcon,
    IconArchiveOff: MockIcon,
    IconBellOff: MockIcon,
    IconDots: MockIcon,
    IconGif: MockIcon,
    IconPhoto: MockIcon,
    IconPin: MockIcon,
    IconPinFilled: MockIcon,
    IconPinnedOff: MockIcon,
    IconPlayerPlayFilled: MockIcon,
  };
});

const mockImpactAsync = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-haptics', () => ({
  impactAsync: (...args: unknown[]) => mockImpactAsync(...args),
  ImpactFeedbackStyle: { Light: 'light' },
}));

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

// Render the right actions inline so the swipe buttons are tappable in tests.
const mockClose = jest.fn();
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function SwipeableStub({
    children,
    renderRightActions,
  }: {
    children: React.ReactNode;
    renderRightActions?: (p: unknown, t: unknown, m: { close: () => void }) => React.ReactNode;
  }) {
    return React.createElement(
      View,
      null,
      renderRightActions?.(null, null, { close: mockClose }),
      children
    );
  }
  return {
    __esModule: true,
    default: SwipeableStub,
  };
});

function makeConversation(overrides: Partial<ConversationWithMeta> = {}): ConversationWithMeta {
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
    unread_count: 0,
    last_sender_id: null,
    last_sender_is_me: false,
    conversation_type: 'inquiry',
    ...DEFAULT_CONVERSATION_PREFERENCES,
    ...overrides,
  };
}

function renderRow(
  conversation: ConversationWithMeta,
  props: Partial<ComponentProps<typeof ConversationRow>> = {}
) {
  const handlers = {
    onOpen: jest.fn(),
    onMore: jest.fn(),
    onTogglePin: jest.fn(),
    onToggleArchive: jest.fn(),
  };
  render(<ConversationRow conversation={conversation} {...handlers} {...props} />);
  return handlers;
}

beforeEach(() => {
  mockClose.mockClear();
  mockImpactAsync.mockClear();
});

describe('ConversationRow', () => {
  it('opens the conversation on press', () => {
    const { onOpen } = renderRow(makeConversation());

    fireEvent.press(screen.getByLabelText('Chat with Ben Cruz about Harbor View'));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('shows More, Pin and Archive and closes the row after an action', () => {
    const conversation = makeConversation();
    const { onMore, onTogglePin, onToggleArchive } = renderRow(conversation);

    fireEvent.press(screen.getByLabelText('More'));
    fireEvent.press(screen.getByLabelText('Pin'));
    fireEvent.press(screen.getByLabelText('Archive'));

    expect(onMore).toHaveBeenCalledWith(conversation, { isPinLocked: false });
    expect(onTogglePin).toHaveBeenCalledWith(conversation);
    expect(onToggleArchive).toHaveBeenCalledWith(conversation);
    expect(mockClose).toHaveBeenCalledTimes(3);
  });

  it('opens the options on hold, with a light haptic', () => {
    const conversation = makeConversation();
    const { onMore, onOpen } = renderRow(conversation, { isPinLocked: true });

    fireEvent(screen.getByLabelText('Chat with Ben Cruz about Harbor View, pinned'), 'onLongPress');

    expect(onMore).toHaveBeenCalledWith(conversation, { isPinLocked: true });
    expect(mockImpactAsync).toHaveBeenCalledWith('light');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('offers Unpin and Unarchive for pinned or archived chats', () => {
    renderRow(makeConversation({ is_pinned: true }));
    expect(screen.getByLabelText('Unpin')).toBeTruthy();

    renderRow(makeConversation({ is_archived: true }));
    expect(screen.getByLabelText('Unarchive')).toBeTruthy();
  });

  it('disables Pin and Archive for the always-pinned landlord chat', () => {
    const { onTogglePin, onToggleArchive } = renderRow(makeConversation(), { isPinLocked: true });

    const unpin = screen.getByLabelText('Unpin');
    expect(unpin.props.accessibilityState).toEqual({ disabled: true });
    expect(screen.getByLabelText('Archive').props.accessibilityState).toEqual({ disabled: true });
    expect(onTogglePin).not.toHaveBeenCalled();
    expect(onToggleArchive).not.toHaveBeenCalled();
  });
});
