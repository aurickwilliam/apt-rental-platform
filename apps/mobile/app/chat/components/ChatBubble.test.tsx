/* eslint-disable react/display-name */
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ChatBubble, { ChatBubbleContent } from './ChatBubble';

let mockStatusChangeListener: ((payload: { error?: Error }) => void) | undefined;
const mockPlayer = {
  play: jest.fn(),
  addListener: jest.fn(),
};

jest.mock('expo-image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Image: (props: object) => React.createElement(View, props) };
});

jest.mock('expo-video', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    VideoView: (props: object) => React.createElement(View, { ...props, testID: 'video-player' }),
    useVideoPlayer: (_uri: string, setup?: (player: typeof mockPlayer) => void) => {
      setup?.(mockPlayer);
      return mockPlayer;
    },
  };
});

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: {
      gray300: '#BDBDBD',
      gray400: '#9CA3AF',
      gray500: '#6C757D',
      textPrimary: '#111',
      danger: '#DC2626',
    },
    isDark: false,
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View, Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const MockMenu = ({ children }: any) => React.createElement(View, null, children);
  (MockMenu as any).Trigger = React.forwardRef(({ children }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({ open: jest.fn(), close: jest.fn() }));
    return React.createElement(View, null, children);
  });
  (MockMenu as any).Portal = ({ children }: any) => React.createElement(View, null, children);
  (MockMenu as any).Overlay = (props: any) => React.createElement(View, props);
  (MockMenu as any).Content = ({ children }: any) => React.createElement(View, null, children);
  (MockMenu as any).Label = (props: any) => React.createElement(Text, props, props.children);
  (MockMenu as any).Item = ({ children, onPress, isDisabled }: any) =>
    React.createElement(Pressable, { onPress: isDisabled ? undefined : onPress }, children);
  (MockMenu as any).ItemTitle = (props: any) => React.createElement(Text, props, props.children);
  return { Menu: MockMenu };
});

jest.mock('expo-blur', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { BlurView: (props: any) => React.createElement(View, props) };
});

jest.mock('@/service/chat/chatService', () => ({
  isEmojiOnly: () => false,
}));

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const mockIcon = () => React.createElement(View);
  return {
    IconPlayerPlayFilled: mockIcon,
    IconX: mockIcon,
    IconCopy: mockIcon,
    IconTrash: mockIcon,
    IconArrowBackUp: mockIcon,
    IconClock: mockIcon,
  };
});

describe('ChatBubble video playback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStatusChangeListener = undefined;
    mockPlayer.addListener.mockImplementation(
      (_event: string, listener: (payload: { error?: Error }) => void) => {
        mockStatusChangeListener = listener;
        return { remove: jest.fn() };
      }
    );
  });

  it('retries a failed video attachment once without changing normal playback', () => {
    const onMediaLoadError = jest.fn();
    render(
      <ChatBubble
        message={null}
        messageType="video"
        attachmentUrl="https://signed.example.test/video.mp4"
        attachmentPath="tenant/video.mp4"
        timestamp="10:00 AM"
        onMediaLoadError={onMediaLoadError}
      />
    );

    fireEvent.press(screen.getByLabelText('Play video'));

    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('video-player')).toBeTruthy();

    act(() => {
      mockStatusChangeListener?.({ error: new Error('Signed URL expired') });
      mockStatusChangeListener?.({ error: new Error('Signed URL expired') });
    });

    expect(onMediaLoadError).toHaveBeenCalledTimes(1);
    expect(onMediaLoadError).toHaveBeenCalledWith('attachment');
  });
});

describe('ChatBubbleContent floating preview (above blur)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a static text clone with reply quote and no menu handlers', () => {
    render(
      <ChatBubbleContent
        message="Hello preview"
        messageType="text"
        isSent
        replyTo={{ id: 'r1', message: 'Original question', messageType: 'text', senderId: 'u2', isSent: false }}
        otherUserName="Ana"
        interactive={false}
      />
    );

    expect(screen.getByText('Hello preview')).toBeTruthy();
    expect(screen.getByText('Original question')).toBeTruthy();
  });

  it('renders static video thumbnail without entering playback', () => {
    render(
      <ChatBubbleContent
        message={null}
        messageType="video"
        attachmentUrl="https://signed.example.test/video.mp4"
        thumbnailUrl="https://signed.example.test/thumb.jpg"
        interactive={false}
      />
    );

    // Static clone is labelled as a message, not as the interactive play button,
    // and never mounts the fullscreen player.
    expect(screen.getByLabelText('Video message')).toBeTruthy();
    expect(screen.queryByLabelText('Play video')).toBeNull();
    expect(screen.queryByTestId('video-player')).toBeNull();
    expect(mockPlayer.play).not.toHaveBeenCalled();
  });

  it('renders the broken-attachment placeholder statically', () => {
    render(
      <ChatBubbleContent
        message={null}
        messageType="image"
        attachmentUrl={null}
        interactive={false}
      />
    );

    expect(screen.getByText('Media unavailable')).toBeTruthy();
  });

  it('notifies the parent on long-press (blur-only fallback without native measure)', () => {
    const onMenuOpenChange = jest.fn();
    render(
      <ChatBubble
        message="Hold me"
        messageType="text"
        isSent
        onMenuOpenChange={onMenuOpenChange}
      />
    );

    const pressable = screen.UNSAFE_getByProps({ delayLongPress: 350 });
    fireEvent(pressable, 'longPress');

    // The menu opens immediately; with no native measure resolving in the
    // test renderer, no floating rect is reported — the screen stays on
    // blur-only instead of dropping the menu.
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    expect(onMenuOpenChange).toHaveBeenCalledTimes(1);
  });
});
