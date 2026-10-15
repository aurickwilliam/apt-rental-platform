// Shared keyed async-request cache (no dependencies).
//
// Used by apps/web session loading so concurrent consumers share one
// in-flight request and reuse a recent resolved value instead of firing
// duplicate Supabase calls. Failures are never cached — the next caller
// retries the load.
//
// Safety rules (auth data must never leak across accounts):
// - Values commit under a key only if no invalidation happened while the
//   load was in flight (generation guard).
// - A settling load never deletes a newer pending entry for the same key
//   (identity guard).
// - Callers invalidate on sign-out / account switch; a signed-out key must
//   never serve a signed-in value (keys differ, so it cannot).
//
// This module stays free of workspace imports so node:test can load it
// directly.

export interface RequestCacheOptions {
  /**
   * How long (ms) a resolved value may be reused without reloading.
   * Defaults to 0: only concurrent in-flight requests are shared.
   */
  staleTimeMs?: number;
  /** Clock override for deterministic tests. Defaults to Date.now. */
  now?: () => number;
}

export class RequestCache<V> {
  private readonly values = new Map<string, { value: V; at: number }>();
  private readonly pending = new Map<string, Promise<V>>();
  private generation = 0;
  private readonly load: (key: string) => Promise<V>;
  private readonly options: RequestCacheOptions;

  constructor(load: (key: string) => Promise<V>, options: RequestCacheOptions = {}) {
    this.load = load;
    this.options = options;
  }

  private get staleTimeMs(): number {
    return this.options.staleTimeMs ?? 0;
  }

  private timestamp(): number {
    return (this.options.now ?? Date.now)();
  }

  get(key: string): Promise<V> {
    const hit = this.values.get(key);
    // Resolved values are reused only inside an explicit TTL window;
    // the default (0) shares in-flight requests but never replays a
    // settled one, so every fresh read reloads.
    if (hit !== undefined && this.staleTimeMs > 0 && this.timestamp() - hit.at <= this.staleTimeMs) {
      return Promise.resolve(hit.value);
    }
    if (hit !== undefined) this.values.delete(key);

    const ongoing = this.pending.get(key);
    if (ongoing) return ongoing;

    const gen = this.generation;
    const entry: { promise: Promise<V> | null } = { promise: null };
    entry.promise = this.load(key).then(
      (value) => {
        if (this.pending.get(key) === entry.promise) this.pending.delete(key);
        if (gen === this.generation) this.values.set(key, { value, at: this.timestamp() });
        return value;
      },
      (error: unknown) => {
        if (this.pending.get(key) === entry.promise) this.pending.delete(key);
        throw error;
      },
    );
    this.pending.set(key, entry.promise);
    return entry.promise;
  }

  /** Write-through (e.g. an explicit refresh whose result is authoritative). */
  set(key: string, value: V): void {
    this.values.set(key, { value, at: this.timestamp() });
  }

  /** Drop one key, or everything when no key is given. Always retires
      in-flight loads so their late resolutions cannot repopulate. */
  invalidate(key?: string): void {
    this.generation += 1;
    if (key === undefined) {
      this.values.clear();
      this.pending.clear();
    } else {
      this.values.delete(key);
      this.pending.delete(key);
    }
  }
}
