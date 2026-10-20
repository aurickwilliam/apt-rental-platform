/**
 * Keyset page accumulation for the finance lists (parity plan §9.2).
 * Framework-free, so node tests drive exactly the semantics the React hooks
 * use: every read belongs to an immutable scope key (owner, month, property
 * plus category or status), results from superseded requests are discarded,
 * load-more runs single-flight, and a pagination failure keeps the rows
 * already shown.
 *
 * State is only ever presented through `apply`, and always from inside a
 * promise callback — synchronous code paths keep their bookkeeping internal,
 * letting hooks derive "first page loading" themselves the way
 * `useAsyncResource` does.
 */

export interface FinancePageSlice<Row, Cursor> {
  rows: readonly Row[];
  /** Cursor to continue after; null when the trail is exhausted. */
  next: Cursor | null;
}

export interface FinancePagesFetcher<Row, Cursor, Scope> {
  (scope: Scope, cursor: Cursor | null): Promise<FinancePageSlice<Row, Cursor>>;
}

export interface FinancePagesRequest<Scope> {
  /** Scope identity; a different key resets the loaded trail. */
  key: string;
  scope: Scope;
}

export interface FinancePagesSnapshot<Row, Cursor> {
  rows: readonly Row[];
  next: Cursor | null;
  /** A follow-up page is in flight. */
  loadingMore: boolean;
  /** First-page failure; the scope shows its retry path. */
  error: string | null;
  /** Load-more failure; loaded rows and the cursor are retained. */
  pageError: string | null;
}

/** A fresh, idle snapshot (typed per call site). */
export function emptyFinancePages<Row, Cursor>(): FinancePagesSnapshot<Row, Cursor> {
  return { rows: [], next: null, loadingMore: false, error: null, pageError: null };
}

export interface FinancePagesOptions<Row, Cursor> {
  /** Called with the settled snapshot and its scope key, from async state
   *  only. Hooks store keyed snapshots so superseded keys never render. */
  apply(key: string, snapshot: FinancePagesSnapshot<Row, Cursor>): void;
  toMessage(error: unknown): string;
}

export interface FinancePagesController<Row, Cursor, Scope> {
  /** Starts the first page for a scope; opening the same key again is a
   *  no-op while it is settled or in flight. Resolves once settled. */
  open(request: FinancePagesRequest<Scope>, fetcher: FinancePagesFetcher<Row, Cursor, Scope>): Promise<void>;
  /** Reloads the active scope's first page; rows already shown stay visible
   *  until the fresh page lands, then the trail shortens back to it. */
  refresh(fetcher: FinancePagesFetcher<Row, Cursor, Scope>): Promise<void>;
  /** Fetches and appends the next page. Resolves once settled; a second
   *  call while one is in flight is a no-op. */
  loadMore(fetcher: FinancePagesFetcher<Row, Cursor, Scope>): Promise<void>;
  /** Clears the trail and discards any in-flight fetch. */
  reset(): void;
}

export function createFinancePages<Row, Cursor, Scope>(
  options: FinancePagesOptions<Row, Cursor>,
): FinancePagesController<Row, Cursor, Scope> {
  const { apply, toMessage } = options;

  let active: FinancePagesRequest<Scope> | null = null;
  let sequence = 0;
  let snapshot = emptyFinancePages<Row, Cursor>();

  // A result may land only while its request is still the newest work for
  // the same scope — this single guard covers account transitions, scope
  // changes and overlapping refreshes.
  const isLive = (seq: number, key: string) => sequence === seq && active?.key === key;

  async function loadFirstPage(
    request: FinancePagesRequest<Scope>,
    fetcher: FinancePagesFetcher<Row, Cursor, Scope>,
    keepRows: boolean,
  ): Promise<void> {
    const seq = ++sequence;
    active = request;
    const retainedRows = keepRows ? snapshot.rows : [];
    try {
      const page = await fetcher(request.scope, null);
      if (!isLive(seq, request.key)) return;
      snapshot = {
        rows: page.rows,
        next: page.next,
        loadingMore: false,
        error: null,
        pageError: null,
      };
    } catch (error) {
      if (!isLive(seq, request.key)) return;
      snapshot = {
        rows: retainedRows,
        next: null,
        loadingMore: false,
        error: toMessage(error),
        pageError: null,
      };
    }
    apply(request.key, snapshot);
  }

  return {
    open(request, fetcher) {
      if (active?.key === request.key) return Promise.resolve();
      return loadFirstPage(request, fetcher, false);
    },

    refresh(fetcher) {
      if (!active) return Promise.resolve();
      return loadFirstPage(active, fetcher, true);
    },

    loadMore(fetcher) {
      if (
        !active ||
        snapshot.loadingMore ||
        snapshot.error ||
        snapshot.next === null
      ) {
        return Promise.resolve();
      }
      const seq = ++sequence;
      const { key, scope } = active;
      const cursor = snapshot.next;
      const previousRows = snapshot.rows;
      // Internal in-flight mark only, so overlapping calls stay blocked;
      // nothing is presented yet — hooks learn about the page when it lands.
      snapshot = { ...snapshot, loadingMore: true, pageError: null };
      return (async () => {
        try {
          const page = await fetcher(scope, cursor);
          if (!isLive(seq, key)) return;
          snapshot = {
            rows: [...previousRows, ...page.rows],
            next: page.next,
            loadingMore: false,
            error: null,
            pageError: null,
          };
        } catch (error) {
          if (!isLive(seq, key)) return;
          snapshot = {
            ...snapshot,
            rows: previousRows,
            loadingMore: false,
            pageError: toMessage(error),
          };
        }
        apply(key, snapshot);
      })();
    },

    reset() {
      if (!active) return;
      sequence += 1; // discards any in-flight fetch for the cleared key
      active = null;
      snapshot = emptyFinancePages<Row, Cursor>();
    },
  };
}
