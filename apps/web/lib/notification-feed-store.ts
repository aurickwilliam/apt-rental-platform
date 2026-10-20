import type { FeedNotification } from "../service/notificationService";

export interface NotificationFeedSnapshot {
  notifications: FeedNotification[];
  loading: boolean;
  error: string | null;
}

export const EMPTY_NOTIFICATION_FEED: NotificationFeedSnapshot = {
  notifications: [], loading: false, error: null,
};

interface NotificationFeedDependencies {
  load: () => Promise<FeedNotification[]>;
  connect: (onChange: () => void) => () => void;
  onIdle: () => void;
  onError: (message: string, error: unknown) => void;
}

/** One account's latest-50 feed, shared by every display (not by portal). */
export class NotificationFeedStore {
  private snapshot: NotificationFeedSnapshot = { ...EMPTY_NOTIFICATION_FEED, loading: true };
  private rows: FeedNotification[] = [];
  private listeners = new Set<() => void>();
  private disconnect: (() => void) | null = null;
  private active = false;
  private generation = 0;
  private inFlight: Promise<void> | null = null;
  private refreshAgain = false;
  private pendingReads = new Map<symbol, Set<string>>();
  // Keep successful optimistic flags until an authoritative read confirms them.
  // A fetch begun before the write must not resurrect an unread dot.
  private confirmedReads = new Set<string>();

  private readonly dependencies: NotificationFeedDependencies;

  constructor(dependencies: NotificationFeedDependencies) {
    this.dependencies = dependencies;
  }

  getSnapshot = (): NotificationFeedSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (!this.active) {
      this.active = true;
      this.disconnect = this.dependencies.connect(this.onRealtime);
      void this.refresh();
    }
    return () => {
      this.listeners.delete(listener);
      // Strict Mode and a portal handover may detach/reattach in one turn.
      // Do not open a second channel/request for that transient zero-ref state.
      queueMicrotask(() => {
        if (this.listeners.size || !this.active) return;
        this.active = false;
        this.generation += 1;
        this.disconnect?.();
        this.disconnect = null;
        this.inFlight = null;
        this.refreshAgain = false;
        this.rows = [];
        this.pendingReads.clear();
        this.confirmedReads.clear();
        this.snapshot = { ...EMPTY_NOTIFICATION_FEED, loading: true };
        this.dependencies.onIdle();
      });
    };
  };

  private publish(loading = this.snapshot.loading, error = this.snapshot.error): void {
    const readIds = new Set(this.confirmedReads);
    for (const ids of this.pendingReads.values()) {
      for (const id of ids) readIds.add(id);
    }
    this.snapshot = {
      notifications: this.rows.map(row => readIds.has(row.id) && !row.is_read
        ? { ...row, is_read: true }
        : row),
      loading,
      error,
    };
    for (const listener of this.listeners) listener();
  }

  private onRealtime = (): void => {
    // An event during an older request needs one trailing refresh, otherwise
    // its new row might not have been visible to that request's DB snapshot.
    if (this.inFlight) this.refreshAgain = true;
    void this.refresh();
  };

  refresh = (): Promise<void> => {
    if (!this.active) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    const generation = this.generation;
    this.publish(true, null);
    const request = Promise.resolve().then(async () => {
      do {
        this.refreshAgain = false;
        try {
          const rows = await this.dependencies.load();
          if (!this.active || generation !== this.generation) return;
          this.rows = rows;
          const byId = new Map(rows.map(row => [row.id, row]));
          for (const id of this.confirmedReads) {
            if (!byId.has(id) || byId.get(id)?.is_read) this.confirmedReads.delete(id);
          }
          this.publish(false, null);
        } catch (error) {
          if (!this.active || generation !== this.generation) return;
          this.dependencies.onError("Couldn't load notifications.", error);
          this.publish(false, "Couldn't load your notifications.");
        }
      } while (this.refreshAgain && this.active && generation === this.generation);
    }).finally(() => {
      if (this.inFlight === request) this.inFlight = null;
    });
    this.inFlight = request;
    return request;
  };

  markRead = async (ids: string[], write: () => Promise<void>): Promise<void> => {
    if (!this.active || ids.length === 0) return;
    const generation = this.generation;
    const operation = Symbol("mark-read");
    this.pendingReads.set(operation, new Set(ids));
    this.publish();
    let failed = false;
    try {
      await write();
      if (!this.active || generation !== this.generation) return;
      for (const id of ids) this.confirmedReads.add(id);
    } catch (error) {
      if (!this.active || generation !== this.generation) return;
      failed = true;
      this.dependencies.onError("Couldn't mark notifications read.", error);
    } finally {
      if (this.active && generation === this.generation) {
        this.pendingReads.delete(operation);
        this.publish();
      }
    }
    if (failed) this.onRealtime();
  };
}
