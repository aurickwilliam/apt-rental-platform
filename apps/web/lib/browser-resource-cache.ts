/** Opt-in presentation data only. Never instantiate this as a server cache. */
export interface BrowserResourceKey {
  authUserId: string;
  profileId: string;
  portal: "tenant" | "landlord" | "admin";
  resource: string;
  /** Canonical filters/cursors/page size; never tokens, signed URLs or form secrets. */
  params: readonly (string | number | boolean | null)[];
}

export interface BrowserResourceSnapshot<T> {
  enabled: boolean;
  hasData: boolean;
  data: T | undefined;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  expiresAt: number;
  revision: number;
}

const EMPTY: BrowserResourceSnapshot<never> = {
  enabled: true, hasData: false, data: undefined, loading: true,
  refreshing: false, error: null, expiresAt: 0, revision: 0,
};
export const DISABLED_RESOURCE: BrowserResourceSnapshot<never> = { ...EMPTY, enabled: false };
const FRESH_MS = 30_000;
const RETAIN_MS = 120_000;
const MAX_ENTRIES = 20;

interface Entry {
  key: BrowserResourceKey;
  snapshot: BrowserResourceSnapshot<unknown>;
  updatedAt: number;
  accessedAt: number;
  invalidated: boolean;
  generation: number;
  pending: Promise<void> | null;
}

export function browserResourceId(key: BrowserResourceKey): string {
  return JSON.stringify([key.authUserId, key.profileId, key.portal, key.resource, key.params]);
}

export class BrowserResourceCache {
  private entries = new Map<string, Entry>();
  private listeners = new Set<() => void>();
  private accountId: string | null = null;
  private generation = 0;
  private readonly now: () => number;
  private readonly freshMs: number;
  private readonly retainMs: number;
  private readonly maxEntries: number;

  constructor(options: { now?: () => number; freshMs?: number; retainMs?: number; maxEntries?: number } = {}) {
    this.now = options.now ?? Date.now;
    this.freshMs = options.freshMs ?? FRESH_MS;
    this.retainMs = options.retainMs ?? RETAIN_MS;
    this.maxEntries = options.maxEntries ?? MAX_ENTRIES;
    if (this.maxEntries < 1 || this.freshMs < 0 || this.retainMs <= this.freshMs) {
      throw new Error("Invalid browser resource retention policy");
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private publish(): void {
    for (const listener of this.listeners) listener();
  }

  /** Called only by the browser Auth lifecycle, never by cached data or route props. */
  setAccount(accountId: string | null): void {
    if (this.accountId === accountId) return;
    this.accountId = accountId;
    this.generation++;
    this.entries.clear();
    this.publish();
  }

  reset(): void {
    this.accountId = null;
    this.generation++;
    this.entries.clear();
    this.publish();
  }

  getSnapshot<T>(key: BrowserResourceKey | null): BrowserResourceSnapshot<T> {
    if (!key || this.accountId !== key.authUserId) return DISABLED_RESOURCE;
    const entry = this.entries.get(browserResourceId(key));
    if (!entry || (entry.snapshot.hasData && this.now() >= entry.snapshot.expiresAt)) return EMPTY;
    entry.accessedAt = this.now();
    return entry.snapshot as BrowserResourceSnapshot<T>;
  }

  /** Hard expiry discards presentation data, including while a route is mounted. */
  expire(key: BrowserResourceKey): void {
    const id = browserResourceId(key);
    const entry = this.entries.get(id);
    if (entry?.snapshot.hasData && this.now() >= entry.snapshot.expiresAt) {
      this.entries.delete(id);
      this.publish();
    }
  }

  /** Mutation invalidation keeps suitable presentation, but retires older reads. */
  invalidate<T>(matches: (key: BrowserResourceKey) => boolean, update?: (data: T) => T): void {
    let changed = false;
    for (const entry of this.entries.values()) {
      if (!matches(entry.key)) continue;
      entry.generation++;
      entry.pending = null;
      entry.invalidated = true;
      entry.snapshot = {
        ...entry.snapshot,
        data: entry.snapshot.hasData && update ? update(entry.snapshot.data as T) : entry.snapshot.data,
        refreshing: false, error: null, revision: entry.snapshot.revision + 1,
      };
      changed = true;
    }
    if (changed) this.publish();
  }

  load<T>(key: BrowserResourceKey, loader: () => Promise<T>, fallbackError: string, force = false): Promise<void> {
    if (this.accountId !== key.authUserId) return Promise.resolve();
    const id = browserResourceId(key);
    const now = this.now();
    // Access-driven eviction also prunes entries for routes no longer mounted.
    for (const [existingId, entry] of this.entries) {
      if (entry.snapshot.hasData && now >= entry.snapshot.expiresAt) this.entries.delete(existingId);
    }
    let entry = this.entries.get(id);
    if (entry?.pending) return entry.pending;
    if (entry && !force && !entry.invalidated && entry.snapshot.hasData && now - entry.updatedAt < this.freshMs) {
      return Promise.resolve();
    }
    if (!entry) {
      while (this.entries.size >= this.maxEntries) {
        const oldest = [...this.entries].sort((a, b) => a[1].accessedAt - b[1].accessedAt)[0];
        this.entries.delete(oldest[0]);
      }
      entry = { key, snapshot: EMPTY, updatedAt: 0, accessedAt: now, invalidated: false, generation: 0, pending: null };
      this.entries.set(id, entry);
    }
    entry.accessedAt = now;
    const target = entry;
    const accountGeneration = this.generation;
    const requestGeneration = target.generation;
    const current = () => this.generation === accountGeneration && this.entries.get(id) === target && target.generation === requestGeneration;
    target.snapshot = { ...target.snapshot, loading: !target.snapshot.hasData, refreshing: target.snapshot.hasData, error: null };
    const request = Promise.resolve()
      .then(async () => {
        if (!current()) return;
        const data = await loader();
        if (!current()) return;
        target.updatedAt = this.now();
        target.invalidated = false;
        target.snapshot = {
          enabled: true, hasData: true, data, loading: false, refreshing: false,
          error: null, expiresAt: target.updatedAt + this.retainMs, revision: target.snapshot.revision,
        };
      })
      .catch((error: unknown) => {
        if (!current()) return;
        console.error(fallbackError, { name: error instanceof Error ? error.name : "ResourceError" });
        target.snapshot = {
          ...target.snapshot, loading: false, refreshing: false,
          error: error instanceof Error && error.message ? error.message : fallbackError,
        };
      })
      .finally(() => {
        if (!current()) return;
        target.pending = null;
        this.publish();
      });
    target.pending = request;
    this.publish();
    return request;
  }
}

let browserCache: BrowserResourceCache | null = null;

export function getBrowserResourceCache(): BrowserResourceCache | null {
  if (typeof window === "undefined") return null;
  browserCache ??= new BrowserResourceCache();
  return browserCache;
}

export function resetBrowserResources(): void {
  browserCache?.reset();
  if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel("apt-resource-session");
      channel.postMessage("reset");
      channel.close();
    } catch {
      // Browser privacy policies must never prevent the actual sign-out.
      console.warn("Cross-tab resource reset unavailable; this tab was cleared.");
    }
  }
}
