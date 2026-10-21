/**
 * In-memory read cache for the Profit & planning reads (report, first pages of
 * the lists). Framework-free so node tests drive the exact rules the hooks use.
 *
 * Stale-while-revalidate: `peek` returns the last known value (until
 * `maxStaleMs`) so a revisited scope or tab paints at once, while `read` reuses
 * a value younger than `freshMs`, shares concurrent loads, and otherwise
 * fetches. Safety rules, matching the profile request cache:
 * - keys start with the owner id, so an account can never read another's value;
 * - a load only commits if nothing was invalidated while it ran;
 * - failures are never cached;
 * - writes call `clearPrefix` so no list or report outlives the change it
 *   depends on.
 */

export interface FinanceCacheOptions {
  /** A value younger than this is reused without loading. 0 disables reuse. */
  freshMs: number;
  /** A value younger than this may paint immediately while it revalidates. */
  maxStaleMs: number;
  /** Clock override for deterministic tests. */
  now?: () => number;
}

interface Entry {
  value: unknown;
  at: number;
}

export class FinanceReadCache {
  private readonly entries = new Map<string, Entry>();
  private readonly pending = new Map<string, Promise<unknown>>();
  private generation = 0;
  private options: FinanceCacheOptions;

  constructor(options: FinanceCacheOptions) {
    this.options = options;
  }

  /** Changes the windows (tests turn caching off or on); drops what is held. */
  configure(options: Partial<FinanceCacheOptions>): void {
    this.options = { ...this.options, ...options };
    this.clear();
  }

  private now(): number {
    return (this.options.now ?? Date.now)();
  }

  private age(entry: Entry): number {
    return this.now() - entry.at;
  }

  /** The last known value, even if stale, for an immediate paint. */
  peek<V>(key: string): V | undefined {
    const entry = this.entries.get(key);
    if (!entry || this.options.maxStaleMs <= 0) return undefined;
    if (this.age(entry) > this.options.maxStaleMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as V;
  }

  /** A fresh value, a shared in-flight load, or a new load (committed on success). */
  read<V>(key: string, load: () => Promise<V>): Promise<V> {
    const entry = this.entries.get(key);
    if (
      entry &&
      this.options.freshMs > 0 &&
      this.age(entry) <= this.options.freshMs
    )
      return Promise.resolve(entry.value as V);
    const ongoing = this.pending.get(key);
    if (ongoing) return ongoing as Promise<V>;
    const generation = this.generation;
    const promise: Promise<V> = load().then(
      (value) => {
        if (this.pending.get(key) === promise) this.pending.delete(key);
        if (generation === this.generation)
          this.entries.set(key, { value, at: this.now() });
        return value;
      },
      (error: unknown) => {
        if (this.pending.get(key) === promise) this.pending.delete(key);
        throw error;
      },
    );
    this.pending.set(key, promise);
    return promise;
  }

  /** Forgets one key so the next read loads (the explicit Refresh path). */
  invalidate(key: string): void {
    this.generation += 1;
    this.entries.delete(key);
    this.pending.delete(key);
  }

  /** Forgets every key with this prefix, e.g. all of an owner's reads. */
  clearPrefix(prefix: string): void {
    this.generation += 1;
    for (const key of [...this.entries.keys()])
      if (key.startsWith(prefix)) this.entries.delete(key);
    for (const key of [...this.pending.keys()])
      if (key.startsWith(prefix)) this.pending.delete(key);
  }

  clear(): void {
    this.generation += 1;
    this.entries.clear();
    this.pending.clear();
  }
}

/** The page-wide instance: one minute fresh, five minutes paintable while stale. */
export const financeReadCache = new FinanceReadCache({
  freshMs: 60_000,
  maxStaleMs: 5 * 60_000,
});

export function financeCacheKey(
  ownerId: string,
  kind: string,
  ...parts: (string | null)[]
): string {
  return [ownerId, kind, ...parts.map((part) => part ?? "")].join("|");
}

/** Prefix covering every read an owner has cached. */
export function financeOwnerPrefix(ownerId: string): string {
  return `${ownerId}|`;
}
