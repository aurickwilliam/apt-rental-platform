import { act, fireEvent, render, screen } from '@testing-library/react-native';

import ChatBubble from './ChatBubble';

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
  useColors: () => ({ colors: { gray300: '#BDBDBD' } }),
}));

jest.mock('@/service/chat/chatService', () => ({
  isEmojiOnly: () => false,
}));

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    IconPlayerPlayFilled: () => React.createElement(View),
    IconX: () => React.createElement(View),
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
