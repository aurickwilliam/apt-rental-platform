import { act, renderHook, waitFor } from '@testing-library/react-native';

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
const mockGetChannels = jest.fn((): unknown[] => []);
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
    getChannels: () => mockGetChannels(),
  },
}));

import { useChatChannel } from './useChatChannel';

const CURRENT_USER_ID = 'current-user';
const OTHER_USER_ID = 'other-user';
const APARTMENT_ID = 'apartment-id';

beforeEach(() => {
  jest.clearAllMocks();
  mockChannels.length = 0;
  mockGetChannels.mockReturnValue([]);
  // The real removeChannel is async — resolve so `await` drains proceed.
  mockRemoveChannel.mockResolvedValue('ok');
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

  /** Validates: stale-channel drain — a still-unregistering predecessor is
   *  removed before new bindings are added (reproduces the
   *  "cannot add `presence` callbacks ... after `subscribe()`" crash). */
  it('drains a still-unregistering channel before binding presence handlers', async () => {
    // Topics follow buildConversationKey(current, other, apartment):
    // chat:<apartment>:<sorted user ids>, prefixed with `realtime:`.
    const staleMsg = {
      topic: 'realtime:chat:msg:chat:apartment-id:current-user:other-user',
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    const stalePresence = {
      topic: 'realtime:chat:presence:chat:apartment-id:current-user:other-user',
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    mockGetChannels.mockReturnValue([staleMsg, stalePresence]);

    const { unmount } = renderHook(() =>
      useChatChannel({
        currentUserId: CURRENT_USER_ID,
        otherUserId: OTHER_USER_ID,
        apartmentId: APARTMENT_ID,
        onNewMessage: jest.fn(),
        onOtherUserTypingChange: jest.fn(),
      })
    );

    // Fresh channels are created only after the stale pair is removed.
    await waitFor(() => expect(mockChannel).toHaveBeenCalledTimes(2));
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
    expect(mockRemoveChannel.mock.invocationCallOrder[0]).toBeLessThan(
      mockChannel.mock.invocationCallOrder[0]
    );
    // The stale joined channels never receive new bindings.
    expect(staleMsg.on).not.toHaveBeenCalled();
    expect(stalePresence.on).not.toHaveBeenCalled();
    // The fresh channels get the full binding set (4 broadcast + 3 presence).
    const freshEvents = mockChannels.flatMap((c) =>
      c.on.mock.calls.map(([event]) => event as string)
    );
    expect(freshEvents.filter((e) => e === 'broadcast')).toHaveLength(4);
    expect(freshEvents.filter((e) => e === 'presence')).toHaveLength(3);

    unmount();
  });

  /** Validates: StrictMode-style unmount/remount on the same conversation
   *  rebinds exactly once without throwing. */
  it('survives an unmount-remount cycle on the same conversation', async () => {
    const props = {
      currentUserId: CURRENT_USER_ID,
      otherUserId: OTHER_USER_ID,
      apartmentId: APARTMENT_ID,
      onNewMessage: jest.fn(),
      onOtherUserTypingChange: jest.fn(),
    };
    const first = renderHook(() => useChatChannel(props));
    await waitFor(() => expect(mockChannel).toHaveBeenCalledTimes(2));

    // Simulate the async gap: the first mount's channels are still registered
    // when the second mount sets up (removeChannel hasn't landed yet).
    mockGetChannels.mockImplementation(() =>
      mockChannels.map((c) => ({ ...c, topic: `realtime:${c.name}` }))
    );
    first.unmount();

    renderHook(() => useChatChannel(props));
    await waitFor(() => expect(mockChannel).toHaveBeenCalledTimes(4));

    const fresh = mockChannels.slice(2);
    expect(fresh).toHaveLength(2);
    expect(fresh[1].on).toHaveBeenCalledWith(
      'presence',
      expect.anything(),
      expect.any(Function)
    );
  });
});
