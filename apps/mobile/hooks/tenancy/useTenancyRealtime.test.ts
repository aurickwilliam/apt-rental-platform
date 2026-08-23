import { act, renderHook } from '@testing-library/react-native';

type MockPostgresFilter = {
  event: string;
  schema: string;
  table: string;
  filter: string;
};

type MockPayload = { eventType: string; new: unknown; old: unknown };
type MockChannelHandler = (payload: MockPayload) => void;

type MockChannel = {
  name: string;
  on: jest.Mock;
  subscribe: jest.Mock;
  filters: MockPostgresFilter[];
  handlers: MockChannelHandler[];
};

const mockChannelsByName = new Map<string, MockChannel>();
const mockRemoveChannel = jest.fn((channel: MockChannel) => {
  for (const [name, value] of mockChannelsByName) {
    if (value === channel) mockChannelsByName.delete(name);
  }
  return Promise.resolve('ok');
});

// Mirrors the real client (realtime-js): supabase.channel() returns the
// existing instance for an already-known topic instead of creating a new one.
// Without this behavior the same-tick remount race cannot be reproduced.
const mockChannelFactory = jest.fn((name: string): MockChannel => {
  const existing = mockChannelsByName.get(name);
  if (existing) return existing;

  const channel: MockChannel = {
    name,
    on: jest.fn(),
    subscribe: jest.fn(() => channel),
    filters: [],
    handlers: [],
  };

  channel.on.mockImplementation(
    (_event: string, filter: MockPostgresFilter, handler: MockChannelHandler) => {
      channel.filters.push(filter);
      channel.handlers.push(handler);
      return channel;
    },
  );
  mockChannelsByName.set(name, channel);

  return channel;
});

jest.mock('@repo/supabase', () => ({
  supabase: {
    channel: (name: string) => mockChannelFactory(name),
    removeChannel: (channel: MockChannel) => mockRemoveChannel(channel),
  },
}));

import {
  useTenancyRealtime,
  type TenancyRealtimeCallbacks,
} from './useTenancyRealtime';

const TENANT_ID = 'tenant-1';
const TENANCY_ID = 'tenancy-1';
const TENANCY_TOPIC = `tenancy-live:${TENANT_ID}`;
const PAYMENT_TOPIC = `tenancy-payment-live:${TENANCY_ID}`;

function flushTimers(): void {
  act(() => {
    jest.advanceTimersByTime(5);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockChannelsByName.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function emit(channel: MockChannel | undefined, payload: MockPayload): void {
  act(() => {
    channel?.handlers[0]?.(payload);
  });
}

describe('useTenancyRealtime', () => {
  it('reuses live channels across an unmount → remount in the same tick', () => {
    const first = renderHook(() => useTenancyRealtime(TENANT_ID, TENANCY_ID, {}));
    expect(mockChannelFactory).toHaveBeenCalledTimes(2);

    first.unmount();

    // Remounting before the deferred teardown fires must reuse the channels —
    // recreating them returns the still-joined instances and throws
    // "cannot add postgres_changes callbacks ... after subscribe()".
    const second = renderHook(() => useTenancyRealtime(TENANT_ID, TENANCY_ID, {}));

    expect(mockChannelFactory).toHaveBeenCalledTimes(2);
    expect(mockRemoveChannel).not.toHaveBeenCalled();

    expect(mockChannelsByName.get(TENANCY_TOPIC)?.filters).toEqual([
      {
        event: '*',
        schema: 'public',
        table: 'tenancies',
        filter: `tenant_id=eq.${TENANT_ID}`,
      },
    ]);
    expect(mockChannelsByName.get(PAYMENT_TOPIC)?.filters).toEqual([
      {
        event: '*',
        schema: 'public',
        table: 'payment',
        filter: `tenancy_id=eq.${TENANCY_ID}`,
      },
    ]);

    second.unmount();
    flushTimers();

    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
  });

  it('removes channels only after the deferred teardown window', () => {
    const { unmount } = renderHook(() =>
      useTenancyRealtime(TENANT_ID, TENANCY_ID, {}),
    );

    unmount();

    expect(mockRemoveChannel).not.toHaveBeenCalled();
    expect(mockChannelsByName.size).toBe(2);

    flushTimers();

    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
    expect(mockChannelsByName.size).toBe(0);
  });

  it('shares one channel per identity across consumers', () => {
    const first = renderHook(() => useTenancyRealtime(TENANT_ID, TENANCY_ID, {}));
    const second = renderHook(() => useTenancyRealtime(TENANT_ID, TENANCY_ID, {}));

    expect(mockChannelFactory).toHaveBeenCalledTimes(2);

    first.unmount();
    flushTimers();

    // One consumer remains — channels must stay subscribed.
    expect(mockRemoveChannel).not.toHaveBeenCalled();
    expect(mockChannelFactory).toHaveBeenCalledTimes(2);

    second.unmount();
    flushTimers();

    expect(mockRemoveChannel).toHaveBeenCalledTimes(2);
  });

  it('fans matching events out and ignores events for other rows', () => {
    const onTenancyChange = jest.fn();
    const onPaymentChange = jest.fn();
    const { unmount } = renderHook(() =>
      useTenancyRealtime(TENANT_ID, TENANCY_ID, { onTenancyChange, onPaymentChange }),
    );

    emit(mockChannelsByName.get(TENANCY_TOPIC), {
      eventType: 'INSERT',
      new: { id: 'tenancy-1', tenant_id: TENANT_ID },
      old: null,
    });
    expect(onTenancyChange).toHaveBeenCalledTimes(1);

    emit(mockChannelsByName.get(TENANCY_TOPIC), {
      eventType: 'UPDATE',
      new: { id: 'other-tenancy', tenant_id: 'someone-else' },
      old: null,
    });
    expect(onTenancyChange).toHaveBeenCalledTimes(1);

    emit(mockChannelsByName.get(PAYMENT_TOPIC), {
      eventType: 'UPDATE',
      new: { id: 'payment-1', tenancy_id: TENANCY_ID, period_start: '2026-08-01' },
      old: null,
    });
    expect(onPaymentChange).toHaveBeenCalledWith({
      eventType: 'UPDATE',
      record: { id: 'payment-1', tenancy_id: TENANCY_ID, period_start: '2026-08-01' },
    });

    emit(mockChannelsByName.get(PAYMENT_TOPIC), {
      eventType: 'DELETE',
      new: null,
      old: { id: 'payment-2', tenancy_id: 'other-tenancy' },
    });
    expect(onPaymentChange).toHaveBeenCalledTimes(1);

    unmount();
    flushTimers();
  });

  it('invokes the latest callbacks through refs without resubscribing', () => {
    const firstOnChange = jest.fn();
    const secondOnChange = jest.fn();

    const { rerender, unmount } = renderHook<
      void,
      { callbacks: TenancyRealtimeCallbacks }
    >(
      ({ callbacks }) => useTenancyRealtime(TENANT_ID, null, callbacks),
      { initialProps: { callbacks: { onTenancyChange: firstOnChange } } },
    );

    expect(mockChannelFactory).toHaveBeenCalledTimes(1);

    rerender({ callbacks: { onTenancyChange: secondOnChange } });

    emit(mockChannelsByName.get(TENANCY_TOPIC), {
      eventType: 'UPDATE',
      new: { id: 'tenancy-1', tenant_id: TENANT_ID },
      old: null,
    });

    expect(firstOnChange).not.toHaveBeenCalled();
    expect(secondOnChange).toHaveBeenCalledTimes(1);
    expect(mockChannelsByName.get(TENANCY_TOPIC)?.handlers).toHaveLength(1);

    unmount();
    flushTimers();
  });
});
