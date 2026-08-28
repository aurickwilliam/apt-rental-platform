import { useEffect, useRef } from "react";

import { supabase } from "@repo/supabase";

export interface TenancyPaymentEvent {
  eventType: string;
  record: Record<string, unknown> | null;
}

export interface TenancyRealtimeCallbacks {
  /** Called on any change to the tenant's `tenancies` row. */
  onTenancyChange?: () => void;
  /** Called on any change to the tenancy's `payment` rows. */
  onPaymentChange?: (event: TenancyPaymentEvent) => void;
}

type Channel = ReturnType<typeof supabase.channel>;

interface TenancyChannelEntry {
  refCount: number;
  teardownTimer: ReturnType<typeof setTimeout> | null;
  subscribers: Set<TenancyRealtimeCallbacks>;
  channel: Channel | null;
}

// Deferred teardown window: an unmount → remount within the same tick (React
// commits cleanup + setup synchronously, e.g. across screen navigation or when
// a query key changes) must reuse the live channel. Recreating it immediately
// returns the still-joined instance from the client registry, and registering
// postgres_changes callbacks on a joined channel throws
// "cannot add ... after subscribe()".
const TEARDOWN_DELAY_MS = 0;

// One realtime subscription per identity, shared by every useTenancy consumer.
// Consumers attach/detach by refcount; channels are torn down when the last
// one leaves. Callbacks are invoked through refs, so a consumer re-rendering
// never tears down and re-subscribes the channel.
const tenancyChannels = new Map<string, TenancyChannelEntry>();
const paymentChannels = new Map<string, TenancyChannelEntry>();

function getRecordString(record: unknown, field: string): string | null {
  if (typeof record !== "object" || record === null) return null;

  const value = (record as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
}

function createRefSubscriber(ref: { current: TenancyRealtimeCallbacks }): TenancyRealtimeCallbacks {
  return {
    onTenancyChange: () => ref.current.onTenancyChange?.(),
    onPaymentChange: (event) => ref.current.onPaymentChange?.(event),
  };
}

function detachSubscriber(
  registry: Map<string, TenancyChannelEntry>,
  topic: string,
  subscriber: TenancyRealtimeCallbacks,
): void {
  const entry = registry.get(topic);
  if (!entry) return;

  entry.subscribers.delete(subscriber);
  entry.refCount -= 1;

  if (entry.refCount > 0 || entry.teardownTimer !== null) return;

  entry.teardownTimer = setTimeout(() => {
    registry.delete(topic);
    if (entry.channel) {
      void supabase.removeChannel(entry.channel);
    }
  }, TEARDOWN_DELAY_MS);
}

function attachSubscriber(
  registry: Map<string, TenancyChannelEntry>,
  topic: string,
  subscriber: TenancyRealtimeCallbacks,
  subscribeEvents: (entry: TenancyChannelEntry) => Channel,
): () => void {
  const existing = registry.get(topic);

  if (existing) {
    if (existing.teardownTimer !== null) {
      clearTimeout(existing.teardownTimer);
      existing.teardownTimer = null;
    }
    existing.refCount += 1;
    existing.subscribers.add(subscriber);
    return () => detachSubscriber(registry, topic, subscriber);
  }

  const entry: TenancyChannelEntry = {
    refCount: 1,
    teardownTimer: null,
    subscribers: new Set([subscriber]),
    channel: null,
  };

  entry.channel = subscribeEvents(entry);
  registry.set(topic, entry);

  return () => detachSubscriber(registry, topic, subscriber);
}

function attachTenantChannel(
  tenantId: string,
  subscriber: TenancyRealtimeCallbacks,
): () => void {
  return attachSubscriber(tenancyChannels, `tenancy-live:${tenantId}`, subscriber, (entry) =>
    supabase
      .channel(`tenancy-live:${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenancies",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          // The filter scopes server-side; this guards stale in-flight events.
          if (getRecordString(payload.new ?? payload.old, "tenant_id") !== tenantId) {
            return;
          }

          for (const listener of entry.subscribers) {
            listener.onTenancyChange?.();
          }
        },
      )
      .subscribe(),
  );
}

function attachPaymentChannel(
  tenancyId: string,
  subscriber: TenancyRealtimeCallbacks,
): () => void {
  return attachSubscriber(paymentChannels, `tenancy-payment-live:${tenancyId}`, subscriber, (entry) =>
    supabase
      .channel(`tenancy-payment-live:${tenancyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payment",
          filter: `tenancy_id=eq.${tenancyId}`,
        },
        (payload) => {
          // The filter scopes server-side; this guards stale in-flight events.
          if (getRecordString(payload.new ?? payload.old, "tenancy_id") !== tenancyId) {
            return;
          }

          for (const listener of entry.subscribers) {
            listener.onPaymentChange?.({
              eventType: payload.eventType,
              record: payload.new ?? payload.old,
            });
          }
        },
      )
      .subscribe(),
  );
}

/**
 * Subscribes the caller to realtime changes on the tenant's `tenancies` row
 * and, once known, the tenancy's `payment` rows. Channels are shared per
 * identity across all consumers; cache logic lives in the provided callbacks.
 */
export function useTenancyRealtime(
  tenantId: string | null,
  tenancyId: string | null,
  callbacks: TenancyRealtimeCallbacks,
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!tenantId) return undefined;

    return attachTenantChannel(tenantId, createRefSubscriber(callbacksRef));
  }, [tenantId]);

  useEffect(() => {
    if (!tenancyId) return undefined;

    return attachPaymentChannel(tenancyId, createRefSubscriber(callbacksRef));
  }, [tenancyId]);
}
