import { fireEvent, render, screen } from '@testing-library/react-native';

import MessageCard from './MessageCard';

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
    IconPhoto: MockIcon,
    IconGif: MockIcon,
    IconPlayerPlayFilled: MockIcon,
    IconBellOff: MockIcon,
    IconPinFilled: MockIcon,
  };
});

// heroui-native ships untranspiled ESM that Jest cannot parse — stub the used
// primitives with real Pressable/View hosts so press and a11y queries work.
jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, View, Text } =
    jest.requireActual<typeof import('react-native')>('react-native');

  const PressableFeedbackMock = function PressableFeedbackMock({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return React.createElement(Pressable, props, children);
  };
  PressableFeedbackMock.Highlight = function Highlight() {
    return null;
  };

  const AvatarMock = function AvatarMock({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return React.createElement(View, null, children);
  };
  AvatarMock.Image = function AvatarImage() {
    return null;
  };
  AvatarMock.Fallback = function AvatarFallback({
    children,
  }: {
    children: React.ReactNode;
  }) {
    // Real Avatar.Fallback renders its initials inside a Text node; the raw
    // string would violate RN's text-in-Text rule under v14's test renderer.
    return React.createElement(View, null, React.createElement(Text, null, children));
  };

  return {
    Avatar: AvatarMock,
    PressableFeedback: PressableFeedbackMock,
  };
});

const baseProps = {
  name: 'Ana Santos',
  apartmentName: 'Sun Residences',
  lastMessage: 'Hello, is the unit still available?',
  timestamp: '2h ago',
};

describe('MessageCard', () => {
  it('renders name, apartment, preview, and timestamp', async () => {
    await render(<MessageCard {...baseProps} />);

    const name = screen.getByText('Ana Santos');
    expect(name).toBeTruthy();
    // Long names shrink (truncate) so the icons and timestamp stay visible.
    expect(name.props.className).toContain('shrink');
    expect(screen.getByText('Sun Residences')).toBeTruthy();
    expect(
      screen.getByText('Hello, is the unit still available?')
    ).toBeTruthy();
    expect(screen.getByText('2h ago')).toBeTruthy();
  });

  it('bolds the name and announces the unread count when unread', async () => {
    await render(<MessageCard {...baseProps} unreadCount={3} />);

    expect(screen.getByText('Ana Santos').props.className).toContain(
      'font-nunitoBold'
    );
    expect(
      screen.getByLabelText(
        'Chat with Ana Santos about Sun Residences, 3 unread messages'
      )
    ).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('keeps the regular weight and a plain label when read', async () => {
    await render(<MessageCard {...baseProps} unreadCount={0} />);

    expect(screen.getByText('Ana Santos').props.className).toContain(
      'font-nunitoSemiBold'
    );
    expect(screen.getByText('Ana Santos').props.className).not.toContain(
      'font-nunitoBold'
    );
    expect(
      screen.getByLabelText('Chat with Ana Santos about Sun Residences')
    ).toBeTruthy();
  });

  it('caps the announced and badged count at 99+', async () => {
    await render(<MessageCard {...baseProps} unreadCount={150} />);

    expect(
      screen.getByLabelText(
        'Chat with Ana Santos about Sun Residences, 99+ unread messages'
      )
    ).toBeTruthy();
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it.each([
    { messageType: 'image', expected: 'Sent a photo' },
    { messageType: 'video', expected: 'Sent a video' },
    { messageType: 'gif', expected: 'Sent a GIF' },
    { messageType: 'file', expected: 'Sent a document' },
  ])('previews a received $messageType attachment', async ({ messageType, expected }) => {
    await render(
      <MessageCard
        {...baseProps}
        lastMessage={null}
        messageType={messageType}
        isUserLastSender={false}
      />
    );

    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('prefixes attachment previews I sent with "You"', async () => {
    await render(
      <MessageCard
        {...baseProps}
        lastMessage={null}
        messageType="video"
        isUserLastSender
      />
    );

    expect(screen.getByText('You sent a video')).toBeTruthy();
  });

  it('opens the conversation on press', async () => {
    const onPress = jest.fn();
    await render(<MessageCard {...baseProps} onPress={onPress} />);

    await fireEvent.press(
      screen.getByLabelText('Chat with Ana Santos about Sun Residences')
    );

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('runs the swipe actions as accessibility actions', async () => {
    const onMore = jest.fn();
    const onPin = jest.fn();
    await render(
      <MessageCard
        {...baseProps}
        actions={[
          { name: 'more', label: 'More options', onPress: onMore },
          { name: 'togglePin', label: 'Pin', onPress: onPin },
        ]}
      />
    );

    const row = screen.getByLabelText('Chat with Ana Santos about Sun Residences');
    await fireEvent(row, 'onAccessibilityAction', { nativeEvent: { actionName: 'togglePin' } });
    await fireEvent(row, 'onAccessibilityAction', { nativeEvent: { actionName: 'unknown' } });

    expect(onPin).toHaveBeenCalledTimes(1);
    expect(onMore).not.toHaveBeenCalled();
  });

  it('announces marked unread, pinned and muted states', async () => {
    await render(<MessageCard {...baseProps} isMarkedUnread isPinned isMuted />);

    expect(
      screen.getByLabelText(
        'Chat with Ana Santos about Sun Residences, marked unread, pinned, muted'
      )
    ).toBeTruthy();
  });
});
