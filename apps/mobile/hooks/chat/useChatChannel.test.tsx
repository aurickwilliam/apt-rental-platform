import { act, renderHook } from '@testing-library/react-native';

type ChannelHandler = (event: { payload: unknown }) => void;

type MockChannel = {
  name: string;
  on: jest.Mock;
  subscribe: jest.Mock;
  send: jest.Mock;
  track: jest.Mock;
  presenceState: jest.Mock;
  handlers: ChannelHandler[];
};

const mockChannels: MockChannel[] = [];
const mockRemoveChannel = jest.fn();
const mockChannel = jest.fn((name: string, _config?: unknown): MockChannel => {
  const channel: MockChannel = {
    name,
    on: jest.fn(),
    subscribe: jest.fn(),
    send: jest.fn(),
    track: jest.fn(),
    presenceState: jest.fn(() => ({})),
    handlers: [],
  };

  channel.on.mockImplementation(
    (_event: string, _filter: unknown, handler: ChannelHandler) => {
      channel.handlers.push(handler);
      return channel;
    }
  );
  channel.subscribe.mockReturnValue(channel);
  mockChannels.push(channel);

  return channel;
});

jest.mock('@repo/supabase', () => ({
  supabase: {
    channel: (name: string, config?: unknown) => mockChannel(name, config),
    removeChannel: (channel: unknown) => mockRemoveChannel(channel),
  },
}));

import { useChatChannel } from './useChatChannel';

const CURRENT_USER_ID = 'current-user';
const OTHER_USER_ID = 'other-user';
const APARTMENT_ID = 'apartment-id';

beforeEach(() => {
  jest.clearAllMocks();
  mockChannels.length = 0;
});

describe('useChatChannel', () => {
  it('keeps channels alive across callback-only rerenders and dispatches through current callback refs', () => {
    const firstOnNewMessage = jest.fn();
    const secondOnNewMessage = jest.fn();
    const onTypingChange = jest.fn();

    const { rerender, unmount } = renderHook<
      ReturnType<typeof useChatChannel>,
      { onNewMessage: jest.Mock }
    >(
      ({ onNewMessage }) =>
        useChatChannel({
          currentUserId: CURRENT_USER_ID,
          otherUserId: OTHER_USER_ID,
          apartmentId: APARTMENT_ID,
          onNewMessage,
          onOtherUserTypingChange: onTypingChange,
        }),
      { initialProps: { onNewMessage: firstOnNewMessage } }
    );

    expect(mockChannel).toHaveBeenCalledTimes(2);
    expect(mockRemoveChannel).not.toHaveBeenCalled();

    rerender({ onNewMessage: secondOnNewMessage });

    expect(mockChannel).toHaveBeenCalledTimes(2);
    expect(mockRemoveChannel).not.toHaveBeenCalled();

    act(() => {
      mockChannels[0].handlers[0]({
        payload: {
          id: 'message-id',
          message: 'Hello',
          messageType: 'text',
          attachmentUrl: null,
          attachmentPath: null,
          created_at: '2026-01-01T00:00:00.000Z',
          sender_id: OTHER_USER_ID,
          apartment_id: APARTMENT_ID,
        },
      });
    });

    expect(firstOnNewMessage).not.toHaveBeenCalled();
    expect(secondOnNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'message-id', message: 'Hello', isSent: false })
    );

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
  });

  it('recreates both channels only when conversation identity changes', () => {
    const { rerender, unmount } = renderHook<
      ReturnType<typeof useChatChannel>,
      { otherUserId: string }
    >(
      ({ otherUserId }) =>
        useChatChannel({
          currentUserId: CURRENT_USER_ID,
          otherUserId,
          apartmentId: APARTMENT_ID,
          onNewMessage: jest.fn(),
          onOtherUserTypingChange: jest.fn(),
        }),
      { initialProps: { otherUserId: OTHER_USER_ID } }
    );

    rerender({ otherUserId: 'another-user' });

    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
    expect(mockChannel).toHaveBeenCalledTimes(4);

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(4);
  });
});
