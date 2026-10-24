import { act, renderHook, waitFor } from '@testing-library/react-native';

type ChannelHandler = (event: { payload: unknown }) => void;

type MockChannel = {
  name: string;
  on: jest.Mock;
  subscribe: jest.Mock;
  send: jest.Mock;
  handlers: ChannelHandler[];
  /** The event name of each handler, parallel to `handlers`. */
  handlerEvents: string[];
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
    handlers: [],
    handlerEvents: [],
  };

  channel.on.mockImplementation(
    (event: string, filter: { event?: string }, handler: ChannelHandler) => {
      channel.handlers.push(handler);
      // The useful name is the binding's event: `broadcast` + `typing`, etc.
      channel.handlerEvents.push(filter?.event ?? event);
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

const baseProps = {
  currentUserId: CURRENT_USER_ID,
  otherUserId: OTHER_USER_ID,
  apartmentId: APARTMENT_ID,
  onNewMessage: jest.fn(),
  onOtherUserTypingChange: jest.fn(),
};

/** A typing Broadcast fired by `broadcastTyping` on the other device. */
const typingEvent = (userId: string, isTyping: boolean) => ({
  payload: { userId, isTyping },
});

/** The binding registered for a named broadcast event. */
const handlerFor = (channel: MockChannel, event: string) => {
  const index = channel.handlerEvents.lastIndexOf(event);
  expect(index).toBeGreaterThanOrEqual(0);
  return channel.handlers[index];
};

/** The hook fires bindings; this drives the subscribed transition it records. */
const subscribeAs = (channel: MockChannel, status: string) => {
  const subscribeCallback = channel.subscribe.mock.calls[0][0] as (
    status: string
  ) => void;
  act(() => subscribeCallback(status));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockChannels.length = 0;
  mockGetChannels.mockReturnValue([]);
  // The real removeChannel is async — resolve so `await` drains proceed.
  mockRemoveChannel.mockResolvedValue('ok');
});

afterEach(() => {
  jest.useRealTimers();
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
          ...baseProps,
          onNewMessage,
          onOtherUserTypingChange: onTypingChange,
        }),
      { initialProps: { onNewMessage: firstOnNewMessage } }
    );

    expect(mockChannel).toHaveBeenCalledTimes(1);
    expect(mockRemoveChannel).not.toHaveBeenCalled();

    rerender({ onNewMessage: secondOnNewMessage });

    expect(mockChannel).toHaveBeenCalledTimes(1);
    expect(mockRemoveChannel).not.toHaveBeenCalled();

    act(() => {
      handlerFor(mockChannels[0], 'new_message')({
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
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
  });

  it('creates no presence channel and binds no presence handler', () => {
    renderHook(() => useChatChannel({ ...baseProps }));

    expect(mockChannel).toHaveBeenCalledTimes(1);
    const [topic, config] = mockChannel.mock.calls[0];
    expect(topic).toContain('chat:msg:');
    expect(topic).not.toContain('chat:presence:');
    expect(config).toBeUndefined();

    const events = mockChannels[0].handlerEvents;
    // new_message, message_deleted, message_reacted, reaction_removed,
    // messages_read, typing — all Broadcast on the one channel.
    expect(events).toEqual([
      'new_message',
      'message_deleted',
      'message_reacted',
      'reaction_removed',
      'messages_read',
      'typing',
    ]);
    expect(events.find((event) => event === 'presence')).toBeUndefined();
  });

  it('recreates the channel only when conversation identity changes', () => {
    const { rerender, unmount } = renderHook<
      ReturnType<typeof useChatChannel>,
      { otherUserId: string }
    >(
      ({ otherUserId }) =>
        useChatChannel({ ...baseProps, otherUserId }),
      { initialProps: { otherUserId: OTHER_USER_ID } }
    );

    rerender({ otherUserId: 'another-user' });

    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    expect(mockChannel).toHaveBeenCalledTimes(2);

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
  });

  /** Validates: stale-channel drain — a still-unregistering predecessor is
   *  removed before new bindings are added (prevents the
   *  "cannot add callbacks ... after subscribe()" crash). */
  it('drains a still-unregistering channel before binding handlers', async () => {
    // Topic: buildConversationKey(current, other, apartment), prefixed with `realtime:`.
    const staleMsg = {
      topic: 'realtime:chat:msg:chat:apartment-id:current-user:other-user',
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    mockGetChannels.mockReturnValue([staleMsg]);

    const { unmount } = renderHook(() => useChatChannel({ ...baseProps }));

    // A fresh channel is created only after the stale one is removed.
    await waitFor(() => expect(mockChannel).toHaveBeenCalledTimes(1));
    expect(mockRemoveChannel).toHaveBeenCalledTimes(1);
    expect(mockRemoveChannel.mock.invocationCallOrder[0]).toBeLessThan(
      mockChannel.mock.invocationCallOrder[0]
    );
    // The stale joined channel never receives new bindings.
    expect(staleMsg.on).not.toHaveBeenCalled();
    // The fresh channel carries the full Broadcast binding set.
    const freshEvents = mockChannels[0].handlerEvents;
    expect(freshEvents).toHaveLength(6);
    expect(freshEvents).toContain('typing');
    expect(freshEvents.find((e) => e === 'presence')).toBeUndefined();

    unmount();
  });

  /** Validates: StrictMode-style unmount/remount on the same conversation
   *  rebinds exactly once without throwing. */
  it('survives an unmount-remount cycle on the same conversation', async () => {
    const first = renderHook(() => useChatChannel({ ...baseProps }));
    await waitFor(() => expect(mockChannel).toHaveBeenCalledTimes(1));

    // Simulate the async gap: the first mount's channel is still registered
    // when the second mount sets up (removeChannel hasn't landed yet).
    mockGetChannels.mockImplementation(() =>
      mockChannels.map((c) => ({ ...c, topic: `realtime:${c.name}` }))
    );
    first.unmount();

    renderHook(() => useChatChannel({ ...baseProps }));
    await waitFor(() => expect(mockChannel).toHaveBeenCalledTimes(2));

    const fresh = mockChannels[1];
    expect(fresh.handlerEvents.find((event) => event === 'typing')).toBe('typing');
  });

  it('sends the typing Broadcast on the message channel only after SUBSCRIBED', () => {
    const { result } = renderHook(() => useChatChannel({ ...baseProps }));

    expect(mockChannel).toHaveBeenCalledTimes(1);
    const channel = mockChannels[0];

    act(() => result.current.broadcastTyping(CURRENT_USER_ID, true));
    expect(channel.send).not.toHaveBeenCalled();

    subscribeAs(channel, 'SUBSCRIBED');

    act(() => result.current.broadcastTyping(CURRENT_USER_ID, true));
    expect(channel.send).toHaveBeenCalledTimes(1);
    expect(channel.send).toHaveBeenCalledWith({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: CURRENT_USER_ID, isTyping: true },
    });

    act(() => result.current.broadcastTyping(CURRENT_USER_ID, false));
    expect(channel.send).toHaveBeenLastCalledWith({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: CURRENT_USER_ID, isTyping: false },
    });
  });

  it('keeps the other user typing while heartbeats arrive and auto-clears a lost stop', () => {
    jest.useFakeTimers();
    const onTypingChange = jest.fn();
    renderHook(() =>
      useChatChannel({ ...baseProps, onOtherUserTypingChange: onTypingChange })
    );
    const typing = handlerFor(mockChannels[0], 'typing');

    // The 4 s heartbeat (useChatTyping) lands inside the 5 s freshness window.
    act(() => typing(typingEvent(OTHER_USER_ID, true)));
    expect(onTypingChange).toHaveBeenLastCalledWith(true);

    act(() => jest.advanceTimersByTime(3000));
    act(() => typing(typingEvent(OTHER_USER_ID, true)));
    expect(onTypingChange).toHaveBeenLastCalledWith(true);

    act(() => jest.advanceTimersByTime(3000)); // still inside the fresh window
    expect(onTypingChange).toHaveBeenLastCalledWith(true);

    // No fresh heartbeat after this: a lost "stop" must not freeze typing.
    act(() => jest.advanceTimersByTime(2000));
    expect(onTypingChange).toHaveBeenLastCalledWith(false);
  });

  it('clears the indicator immediately on a stop Broadcast and ignores echoes of your own typing', () => {
    const onTypingChange = jest.fn();
    renderHook(() =>
      useChatChannel({ ...baseProps, onOtherUserTypingChange: onTypingChange })
    );
    const typing = handlerFor(mockChannels[0], 'typing');

    act(() => typing(typingEvent(OTHER_USER_ID, true)));
    expect(onTypingChange).toHaveBeenLastCalledWith(true);

    act(() => typing(typingEvent(OTHER_USER_ID, false)));
    expect(onTypingChange).toHaveBeenLastCalledWith(false);

    // Your own Broadcast (self-echo) is not "the other user".
    act(() => typing(typingEvent(CURRENT_USER_ID, true)));
    expect(onTypingChange).toHaveBeenLastCalledWith(false);
  });
});
