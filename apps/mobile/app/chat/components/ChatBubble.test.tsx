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
    IconPhoto: mockIcon,
    IconGif: mockIcon,
    IconPlus: mockIcon,
  };
});

jest.mock('rn-emoji-keyboard', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { __esModule: true, default: () => React.createElement(View) };
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light' },
}));

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
    expect(screen.getByText('You replied')).toBeTruthy();
  });

  it('labels a received reply with the other user name', () => {
    render(
      <ChatBubbleContent
        message="Got it"
        messageType="text"
        isSent={false}
        replyTo={{ id: 'r2', message: 'See you at 5?', messageType: 'text', senderId: 'u1', isSent: true }}
        otherUserName="Ana"
        interactive={false}
      />
    );

    expect(screen.getByText('Ana replied')).toBeTruthy();
    expect(screen.getByText('See you at 5?')).toBeTruthy();
  });

  it('renders an icon tile for a quoted photo', () => {
    render(
      <ChatBubbleContent
        message="Nice shot"
        messageType="text"
        isSent
        replyTo={{ id: 'r3', message: null, messageType: 'image', senderId: 'u2', isSent: false }}
        otherUserName="Ana"
        interactive={false}
      />
    );

    expect(screen.getByText('You replied')).toBeTruthy();
    expect(screen.getByText('Photo')).toBeTruthy();
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

  it('renders the reaction badge at the bottom-right when reactions exist', () => {
    render(
      <ChatBubbleContent
        message="Hello"
        messageType="text"
        isSent
        reactions={[
          { emoji: '❤️', userId: 'u1', isMine: true },
          { emoji: '😂', userId: 'u2', isMine: false },
        ]}
        interactive={false}
      />
    );

    expect(screen.getByLabelText('Reactions: ❤️, 😂')).toBeTruthy();
    expect(screen.getByText('❤️')).toBeTruthy();
    expect(screen.getByText('😂')).toBeTruthy();
  });

  it('renders no badge when there are no reactions', () => {
    render(
      <ChatBubbleContent
        message="Hello"
        messageType="text"
        isSent
        reactions={[]}
        interactive={false}
      />
    );

    expect(screen.queryByLabelText(/Reactions:/)).toBeNull();
  });

  it('plays video on a single tap after the double-tap window when reactions are enabled', () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000_000);
    try {
      render(
        <ChatBubble
          message={null}
          messageType="video"
          attachmentUrl="https://signed.example.test/video.mp4"
          attachmentPath="tenant/video.mp4"
          timestamp="10:00 AM"
          onReact={jest.fn()}
        />
      );

      fireEvent.press(screen.getByLabelText('Play video'));
      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('toggles a heart on double-tap', () => {
    const onReact = jest.fn();
    render(
      <ChatBubble
        message="Double tap me"
        messageType="text"
        isSent
        onReact={onReact}
      />
    );

    const pressable = screen.UNSAFE_getByProps({ delayLongPress: 350 });
    fireEvent.press(pressable);
    fireEvent.press(pressable);

    expect(onReact).toHaveBeenCalledTimes(1);
    expect(onReact).toHaveBeenCalledWith('❤️');
  });

  it('reports the hold with the measured window anchor', () => {
    // The row measures itself via View.prototype.measureInWindow.
    const { View } = jest.requireActual<typeof import('react-native')>('react-native');
    const spy = jest
      .spyOn(View.prototype as object, 'measureInWindow' as never)
      .mockImplementation(function (
        this: unknown,
        cb: (x: number, y: number, w: number, h: number) => void
      ) {
        cb(24, 250, 120, 60);
      } as never);
    try {
      const onHold = jest.fn();
      const onMenuOpenChange = jest.fn();
      render(
        <ChatBubble
          message="Hold me"
          messageType="text"
          isSent
          onHold={onHold}
          onMenuOpenChange={onMenuOpenChange}
        />
      );

      const pressable = screen.UNSAFE_getByProps({ delayLongPress: 350 });
      fireEvent(pressable, 'longPress');

      expect(onHold).toHaveBeenCalledTimes(1);
      expect(onHold).toHaveBeenCalledWith({ pageY: 250, height: 60 });
      expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('never reports a hold on single tap', () => {
    jest.useFakeTimers();
    try {
      const onHold = jest.fn();
      render(
        <ChatBubble
          message="Tap me"
          messageType="text"
          isSent
          onReact={jest.fn()}
          onHold={onHold}
        />
      );

      fireEvent.press(screen.UNSAFE_getByProps({ delayLongPress: 350 }));
      act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(onHold).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('hides the row (layout kept) while its elevated clone shows', () => {
    const { rerender } = render(
      <ChatBubble message="Hold me" messageType="text" isSent />
    );

    const row = screen.UNSAFE_getByProps({ collapsable: false });
    expect(row.props.className).not.toMatch('opacity-0');

    rerender(<ChatBubble message="Hold me" messageType="text" isSent hidden />);

    // Same single bubble, now transparent — the overlay clone takes over.
    expect(screen.UNSAFE_getByProps({ collapsable: false }).props.className).toMatch(
      'opacity-0'
    );
    expect(screen.getByText('Hold me')).toBeTruthy();
  });
});
