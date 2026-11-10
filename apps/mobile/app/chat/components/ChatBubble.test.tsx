import { Linking, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { findAllInTree } from '../../../tests/support/testTraversal';

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

// Gesture + Reanimated wrapper; the swipe itself is exercised on device.
jest.mock('./SwipeToReply', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('./SenderAvatar', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'sender-avatar' }),
  };
});
jest.mock('./SeenAvatar', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: ({ belowReactions }: { belowReactions?: boolean }) =>
      React.createElement(View, { testID: 'seen-avatar', accessibilityLabel: belowReactions ? 'below' : 'plain' }),
  };
});
jest.mock('./TimestampRevealRow', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

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
    IconFileText: mockIcon,
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

  it('retries a failed video attachment once without changing normal playback', async () => {
    const onMediaLoadError = jest.fn();
    await render(
      <ChatBubble
        message={null}
        messageType="video"
        attachmentUrl="https://signed.example.test/video.mp4"
        attachmentPath="tenant/video.mp4"
        timestamp="10:00 AM"
        onMediaLoadError={onMediaLoadError}
      />
    );

    await fireEvent.press(screen.getByLabelText('Play video'));

    expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('video-player')).toBeTruthy();

    await act(() => {
      mockStatusChangeListener?.({ error: new Error('Signed URL expired') });
      mockStatusChangeListener?.({ error: new Error('Signed URL expired') });
    });

    expect(onMediaLoadError).toHaveBeenCalledTimes(1);
    expect(onMediaLoadError).toHaveBeenCalledWith('attachment');
  });
});

describe('ChatBubble received documents', () => {
  it('shows a filename and size and opens the private attachment', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<ChatBubble message={null} messageType="file" attachmentName="Lease.pdf" attachmentSize={2048} attachmentUrl="https://signed.example.test/lease.pdf" />);
    expect(screen.getByText('Lease.pdf')).toBeTruthy();
    expect(screen.getByText('2 KB')).toBeTruthy();
    await act(async () => await fireEvent.press(screen.getByLabelText('Open Lease.pdf')));
    expect(open).toHaveBeenCalledWith('https://signed.example.test/lease.pdf');
    open.mockRestore();
  });

  it('does not open a document from the non-interactive floating preview', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    await render(<ChatBubbleContent message={null} messageType="file" attachmentName="Lease.docx" attachmentUrl="https://signed.example.test/lease.docx" interactive={false} />);
    await fireEvent.press(screen.getByLabelText('Open Lease.docx'));
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});

describe('ChatBubbleContent floating preview (above blur)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a static text clone with reply quote and no menu handlers', async () => {
    await render(
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
    expect(screen.getByText('You replied to Ana')).toBeTruthy();
  });

  it('labels a received reply with the other user name', async () => {
    await render(
      <ChatBubbleContent
        message="Got it"
        messageType="text"
        isSent={false}
        replyTo={{ id: 'r2', message: 'See you at 5?', messageType: 'text', senderId: 'u1', isSent: true }}
        otherUserName="Ana"
        interactive={false}
      />
    );

    expect(screen.getByText('Ana replied to you')).toBeTruthy();
    expect(screen.getByText('See you at 5?')).toBeTruthy();
  });

  it('renders an icon tile for a quoted photo', async () => {
    await render(
      <ChatBubbleContent
        message="Nice shot"
        messageType="text"
        isSent
        replyTo={{ id: 'r3', message: null, messageType: 'image', senderId: 'u2', isSent: false }}
        otherUserName="Ana"
        interactive={false}
      />
    );

    expect(screen.getByText('You replied to Ana')).toBeTruthy();
    expect(screen.getByText('Photo')).toBeTruthy();
  });

  it('shows the quoted photo itself, dimmed, instead of an icon tile when its image is known', async () => {
    await render(
      <ChatBubbleContent
        message="And blazing"
        messageType="text"
        isSent
        replyTo={{
          id: 'r4',
          message: null,
          messageType: 'image',
          senderId: 'me',
          isSent: true,
          previewUrl: 'https://signed.example.test/quoted.jpg',
        }}
        otherUserName="Ana"
        interactive={false}
      />
    );

    expect(screen.getByText('You replied to yourself')).toBeTruthy();
    expect(screen.getByLabelText('Quoted Photo')).toBeTruthy();
    expect(screen.queryByText('Photo')).toBeNull();
  });

  it('renders static video thumbnail without entering playback', async () => {
    await render(
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

  it('renders the broken-attachment placeholder statically', async () => {
    await render(
      <ChatBubbleContent
        message={null}
        messageType="image"
        attachmentUrl={null}
        interactive={false}
      />
    );

    expect(screen.getByText('Media unavailable')).toBeTruthy();
  });

  it('renders the reaction badge at the bottom-right when reactions exist', async () => {
    await render(
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

  it('merges the same emoji from two people into one badge with a count', async () => {
    await render(
      <ChatBubbleContent
        message="Hello"
        messageType="text"
        isSent
        reactions={[
          { emoji: '👍', userId: 'u1', isMine: true },
          { emoji: '👍', userId: 'u2', isMine: false },
        ]}
        interactive={false}
      />
    );

    expect(screen.getAllByText('👍')).toHaveLength(1);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByLabelText('Reactions: 👍 2')).toBeTruthy();
  });

  it('renders no badge when there are no reactions', async () => {
    await render(
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

  it('plays video on a single tap after the double-tap window when reactions are enabled', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000_000);
    try {
      await render(
        <ChatBubble
          message={null}
          messageType="video"
          attachmentUrl="https://signed.example.test/video.mp4"
          attachmentPath="tenant/video.mp4"
          timestamp="10:00 AM"
          onReact={jest.fn()}
        />
      );

      await fireEvent.press(screen.getByLabelText('Play video'));
      await act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(mockPlayer.play).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('toggles a heart on double-tap', async () => {
    const onReact = jest.fn();
    await render(
      <ChatBubble
        message="Double tap me"
        messageType="text"
        isSent
        onReact={onReact}
      />
    );

    // Events bubble from the text up to the row's Pressable.
    const pressable = screen.getByText('Double tap me');
    await fireEvent.press(pressable);
    await fireEvent.press(pressable);

    expect(onReact).toHaveBeenCalledTimes(1);
    expect(onReact).toHaveBeenCalledWith('❤️');
  });

  it('reports the hold with the measured window anchor', async () => {
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
      await render(
        <ChatBubble
          message="Hold me"
          messageType="text"
          isSent
          onHold={onHold}
          onMenuOpenChange={onMenuOpenChange}
        />
      );

      const pressable = screen.getByText('Hold me');
      await fireEvent(pressable, 'longPress');

      expect(onHold).toHaveBeenCalledTimes(1);
      expect(onHold).toHaveBeenCalledWith({ pageX: 24, pageY: 250, width: 120, height: 60 });
      expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    } finally {
      spy.mockRestore();
    }
  });

  it('never reports a hold on single tap', async () => {
    jest.useFakeTimers();
    try {
      const onHold = jest.fn();
      await render(
        <ChatBubble
          message="Tap me"
          messageType="text"
          isSent
          onReact={jest.fn()}
          onHold={onHold}
        />
      );

      await fireEvent.press(screen.getByText('Tap me'));
      await act(() => {
        jest.advanceTimersByTime(350);
      });

      expect(onHold).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('hides the row (layout kept) while its elevated clone shows', async () => {
    const { rerender } = await render(
      <ChatBubble message="Hold me" messageType="text" isSent />
    );

    const row = findAllInTree(screen.root!, (node) => node.props.collapsable === false)[0];
    expect(row.props.className).not.toMatch('opacity-0');

    await rerender(<ChatBubble message="Hold me" messageType="text" isSent hidden />);

    // Same single bubble, now transparent — the overlay clone takes over.
    expect(findAllInTree(screen.root!, (node) => node.props.collapsable === false)[0].props.className).toMatch(
      'opacity-0'
    );
    expect(screen.getByText('Hold me')).toBeTruthy();
  });

  it('offers a Reply accessibility action that starts a reply', async () => {
    const onReply = jest.fn();
    await render(<ChatBubble message="Reply to me" messageType="text" onReply={onReply} />);

    const row = findAllInTree(screen.root!, (node) => node.props.accessibilityActions !== undefined)[0];
    expect(row.props.accessibilityActions).toEqual([{ name: 'reply', label: 'Reply' }]);

    await fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'reply' } });
    expect(onReply).toHaveBeenCalledTimes(1);
  });

  it('offers no Reply action while the message is still sending', async () => {
    await render(
      <ChatBubble message="Sending" messageType="text" isPending onReply={jest.fn()} />
    );

    expect(
      findAllInTree(screen.root!, (node) => node.props.accessibilityActions !== undefined)
    ).toHaveLength(0);
  });

  it("shows the sender's avatar only where asked, and never on sent bubbles", async () => {
    const { rerender } = await render(
      <ChatBubble message="Hi" messageType="text" showSenderAvatar />
    );
    expect(screen.getByTestId('sender-avatar')).toBeTruthy();

    await rerender(<ChatBubble message="Hi" messageType="text" />);
    expect(screen.queryByTestId('sender-avatar')).toBeNull();

    await rerender(<ChatBubble message="Hi" messageType="text" isSent showSenderAvatar />);
    expect(screen.queryByTestId('sender-avatar')).toBeNull();
  });

  it('shrinks the corners where same-sender bubbles meet', async () => {
    // The text bubble is the nearest ancestor with an explicit corner radius.
    const bubbleCorners = (text: string) => {
      let node = screen.getByText(text).parent;
      while (node) {
        const style = StyleSheet.flatten(node.props.style) ?? {};
        if ('borderTopLeftRadius' in style || 'borderTopRightRadius' in style) return style;
        node = node.parent;
      }
      return {};
    };

    const { rerender } = await render(
      <ChatBubbleContent message="Middle" messageType="text" isSent groupPosition="middle" />
    );
    expect(await bubbleCorners('Middle')).toMatchObject({
      borderTopRightRadius: 6,
      borderBottomRightRadius: 6,
    });

    await rerender(<ChatBubbleContent message="Top" messageType="text" groupPosition="first" />);
    expect(await bubbleCorners('Top')).toMatchObject({
      borderTopLeftRadius: 24,
      borderBottomLeftRadius: 6,
    });

    await rerender(<ChatBubbleContent message="Alone" messageType="text" isSent />);
    expect(await bubbleCorners('Alone')).toMatchObject({
      borderTopRightRadius: 24,
      borderBottomRightRadius: 24,
    });
  });

  it('shows the Seen avatar only on the bubble that asks for it', async () => {
    const { rerender } = await render(<ChatBubble message="Sent" messageType="text" isSent showSeen />);
    expect(screen.getByTestId('seen-avatar')).toBeTruthy();

    await rerender(<ChatBubble message="Sent" messageType="text" isSent />);
    expect(screen.queryByTestId('seen-avatar')).toBeNull();
  });

  it('moves the Seen avatar below a reaction badge so the two never overlap', async () => {
    const { rerender } = await render(<ChatBubble message="Sent" messageType="text" isSent showSeen />);
    expect(screen.getByTestId('seen-avatar').props.accessibilityLabel).toBe('plain');

    await rerender(
      <ChatBubble
        message="Sent"
        messageType="text"
        isSent
        showSeen
        reactions={[{ userId: 'u2', emoji: '👍', isMine: false }]}
      />
    );
    expect(screen.getByTestId('seen-avatar').props.accessibilityLabel).toBe('below');
  });
});

describe('ChatBubble reply navigation', () => {
  it('jumps to the original when the quote above a reply is tapped', async () => {
    const onJumpToReply = jest.fn();
    await render(
      <ChatBubbleContent
        message="Got it"
        messageType="text"
        isSent
        replyTo={{ id: 'orig-1', message: 'See you at 5?', messageType: 'text', senderId: 'u1', isSent: false }}
        onJumpToReply={onJumpToReply}
      />
    );

    await fireEvent.press(screen.getByLabelText('Jump to original message'));
    expect(onJumpToReply).toHaveBeenCalledWith('orig-1');
  });

  it('has no jump target for a plain message or when navigation is off', async () => {
    await render(<ChatBubbleContent message="Hi" messageType="text" isSent onJumpToReply={jest.fn()} />);
    expect(screen.queryByLabelText('Jump to original message')).toBeNull();
  });
});
