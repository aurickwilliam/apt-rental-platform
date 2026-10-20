"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  financeIncomeMonthsFromReports,
  shiftFinanceMonth,
  type FinanceBudget,
  type FinanceCategory,
} from "@repo/utils";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { useUser } from "@/hooks/use-user";
import { FINANCE_ACCESS_ERROR } from "@/lib/landlord-finance-access";
import {
  createFinancePages,
  emptyFinancePages,
  type FinancePagesFetcher,
  type FinancePagesRequest,
  type FinancePagesSnapshot,
} from "@/lib/landlord-finance-pages";
import {
  confirmExpenseReview,
  deleteBudget as deleteBudgetTransport,
  deleteExpense as deleteExpenseTransport,
  fetchExpensePage,
  fetchFinances,
  fetchRentLedger,
  financeErrorMessage,
  saveBudget as saveBudgetTransport,
  saveExpense as saveExpenseTransport,
  type CollectionStatus,
  type ExpenseCursor,
  type ExpenseDraft,
  type ExpenseRecord,
  type FinanceData,
  type FinanceIncomeMonth,
  type FinanceScope,
  type RentLedgerRow,
} from "@/service/landlordFinanceService";

/** The shared generic failure sentence, single-sourced from @repo/utils
 *  (the loaders already map transport errors to the same wording). */
const FINANCE_REPORT_FALLBACK = financeErrorMessage(null);

const EMPTY_FINANCE_DATA: FinanceData = {
  properties: [],
  months: [],
  comparison: { collected: 0, operating: 0, reviewed: false },
  categories: [],
  budgets: [],
  performance: [],
  collections: {
    expected: 0,
    collected: 0,
    pending: 0,
    overdue: 0,
    overdueCount: 0,
    age7: 0,
    age30: 0,
    ageOlder: 0,
  },
  unclassified: 0,
};

export interface FinanceOperation {
  pending: boolean;
  error: string | null;
  clearError(): void;
}

function useFinanceOperation(): FinanceOperation & {
  run(action: () => Promise<void>): Promise<boolean>;
} {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const clearError = useCallback(() => setError(null), []);
  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      if (inFlight.current) return false;
      inFlight.current = true;
      setPending(true);
      setError(null);
      try {
        await action();
        return true;
      } catch (err) {
        console.error("Finance operation failed");
        setError(financeErrorMessage(err));
        return false;
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [],
  );
  return { pending, error, clearError, run };
}

/**
 * Client-side finance identity, mirroring mobile's `useFinanceAccess`: the
 * report and every finance call scope to the signed-in profile's internal
 * `users.id`. Web snapshots are session-verified inside `useUser`, so no
 * separate portal/auth-id check is needed; suspension is enforced by the
 * server route guard and the active-accounts policies.
 */
export function useFinanceAccess() {
  const { user, profile, loading } = useUser();
  const ownerId = profile?.id ?? null;
  const enabled = !!ownerId && !!user && !!profile?.roles.includes("landlord");
  return { ownerId, enabled, loading };
}

/**
 * The scoped report (mobile `useLandlordFinances`): loads when finance access
 * resolves, exposes per-operation save/delete/review handles, and reloads the
 * report after a successful write — matching the mobile invalidation family
 * for the resources this hook owns. Visible lists refresh through their own
 * handles in the components that mount them.
 */
export function useLandlordFinances(scope: FinanceScope) {
  const { ownerId, enabled, loading: userLoading } = useFinanceAccess();
  const { month, apartmentId } = scope;
  const scopeKey = JSON.stringify([ownerId, month, apartmentId]);
  const currentScope = useRef<string | null>(scopeKey);
  useEffect(() => {
    currentScope.current = scopeKey;
    return () => {
      currentScope.current = null;
    };
  }, [scopeKey]);

  const load = useCallback(async (): Promise<{
    key: string;
    data: FinanceData;
  } | null> => {
    if (!ownerId || !enabled) return null;
    try {
      return {
        key: scopeKey,
        data: await fetchFinances({ month, apartmentId }),
      };
    } catch (error) {
      // Transport failures surface the shared wording (identical on mobile),
      // so the report shows the mapped message as-is.
      throw new Error(financeErrorMessage(error));
    }
  }, [ownerId, enabled, month, apartmentId, scopeKey]);

  const report = useAsyncResource(load, null, FINANCE_REPORT_FALLBACK);
  const hasData = enabled && report.data?.key === scopeKey;
  const { refresh: refreshReport } = report;
  const latestRefresh = useRef(refreshReport);
  useEffect(() => {
    latestRefresh.current = refreshReport;
  }, [refreshReport]);

  const saveExpenseOp = useFinanceOperation();
  const { run: runSaveExpense } = saveExpenseOp;
  const removeExpenseOp = useFinanceOperation();
  const { run: runRemoveExpense } = removeExpenseOp;
  const saveBudgetOp = useFinanceOperation();
  const { run: runSaveBudget } = saveBudgetOp;
  const removeBudgetOp = useFinanceOperation();
  const { run: runRemoveBudget } = removeBudgetOp;
  const reviewOp = useFinanceOperation();
  const { run: runReview } = reviewOp;

  const saveExpense = useCallback(
    async (draft: ExpenseDraft, editing: boolean) => {
      const ok = await runSaveExpense(async () => {
        if (!ownerId || !enabled) throw new Error(FINANCE_ACCESS_ERROR);
        await saveExpenseTransport(ownerId, draft, editing);
      });
      // A write can change two months, review flags and chart windows; the
      // report reloads, list handles refresh in their own components.
      if (ok && currentScope.current === scopeKey) void latestRefresh.current();
      return ok;
    },
    [runSaveExpense, ownerId, enabled, refreshReport, scopeKey],
  );

  const removeExpense = useCallback(
    async (id: string) => {
      const ok = await runRemoveExpense(async () => {
        if (!ownerId || !enabled) throw new Error(FINANCE_ACCESS_ERROR);
        await deleteExpenseTransport(ownerId, id);
      });
      if (ok && currentScope.current === scopeKey) void latestRefresh.current();
      return ok;
    },
    [runRemoveExpense, ownerId, enabled, refreshReport, scopeKey],
  );

  const saveBudget = useCallback(
    async (value: Omit<FinanceBudget, "id">) => {
      const ok = await runSaveBudget(async () => {
        if (!ownerId || !enabled) throw new Error(FINANCE_ACCESS_ERROR);
        await saveBudgetTransport(value);
      });
      if (ok && currentScope.current === scopeKey) void latestRefresh.current();
      return ok;
    },
    [runSaveBudget, ownerId, enabled, refreshReport, scopeKey],
  );

  const removeBudget = useCallback(
    async (id: string) => {
      const ok = await runRemoveBudget(async () => {
        if (!ownerId || !enabled) throw new Error(FINANCE_ACCESS_ERROR);
        await deleteBudgetTransport(ownerId, id);
      });
      if (ok && currentScope.current === scopeKey) void latestRefresh.current();
      return ok;
    },
    [runRemoveBudget, ownerId, enabled, refreshReport, scopeKey],
  );

  const reviewExpenses = useCallback(async () => {
    const ok = await runReview(async () => {
      if (!ownerId || !enabled) throw new Error(FINANCE_ACCESS_ERROR);
      await confirmExpenseReview({ month, apartmentId });
    });
    if (ok && currentScope.current === scopeKey) void latestRefresh.current();
    return ok;
  }, [
    runReview,
    ownerId,
    enabled,
    refreshReport,
    month,
    apartmentId,
    scopeKey,
  ]);

  return {
    report: {
      data: hasData ? report.data!.data : EMPTY_FINANCE_DATA,
      loading: report.loading,
      initialLoading: !hasData && report.loading,
      refreshing: hasData && report.loading,
      hasData,
      error: report.error,
      refresh: refreshReport,
    },
    ownerId,
    enabled,
    userLoading,
    saveExpense,
    savingExpense: {
      pending: saveExpenseOp.pending,
      error: saveExpenseOp.error,
      clearError: saveExpenseOp.clearError,
    },
    removeExpense,
    removingExpense: {
      pending: removeExpenseOp.pending,
      error: removeExpenseOp.error,
      clearError: removeExpenseOp.clearError,
    },
    saveBudget,
    savingBudget: {
      pending: saveBudgetOp.pending,
      error: saveBudgetOp.error,
      clearError: saveBudgetOp.clearError,
    },
    removeBudget,
    removingBudget: {
      pending: removeBudgetOp.pending,
      error: removeBudgetOp.error,
      clearError: removeBudgetOp.clearError,
    },
    reviewExpenses,
    reviewing: {
      pending: reviewOp.pending,
      error: reviewOp.error,
      clearError: reviewOp.clearError,
    },
  };
}

/**
 * The month-picker's collected-rent markers for an open Filters draft,
 * mirroring mobile's gated fallback: the applied report first, then a second
 * bounded report a year earlier only when the deployment stores a shorter
 * chart window. Loads only while the picker is open.
 */
export function useFinanceIncomeMonths(
  currentMonth: string,
  apartmentId: string | null,
  isOpen: boolean,
) {
  const { ownerId, enabled } = useFinanceAccess();
  const gated = enabled && isOpen;

  const indicatorKey = JSON.stringify([ownerId, currentMonth, apartmentId]);
  const load = useCallback(async (): Promise<{
    key: string;
    months: FinanceIncomeMonth[];
  } | null> => {
    if (!gated || !ownerId) return null;
    try {
      const latest = await fetchFinances({ month: currentMonth, apartmentId });
      if (latest.incomeMonths)
        return { key: indicatorKey, months: latest.incomeMonths };
      const earlier = await fetchFinances({
        month: shiftFinanceMonth(currentMonth, -12),
        apartmentId,
      });
      return {
        key: indicatorKey,
        months: financeIncomeMonthsFromReports(earlier.months, latest.months),
      };
    } catch (error) {
      throw new Error(financeErrorMessage(error));
    }
  }, [gated, ownerId, currentMonth, apartmentId, indicatorKey]);

  const resource = useAsyncResource(load, null, FINANCE_REPORT_FALLBACK);
  return {
    ...resource,
    data:
      resource.data?.key === indicatorKey ? resource.data.months : undefined,
  };
}

export interface FinancePagesResult<Row> {
  rows: readonly Row[];
  /** True while the trail cursor is live. */
  hasMore: boolean;
  /** The first page for the current scope has not settled yet. */
  loading: boolean;
  /** A follow-up page is in flight. */
  loadingMore: boolean;
  /** First-page failure; `refresh` retries it. */
  error: string | null;
  /** Load-more failure; loaded rows are retained, `loadMore` retries. */
  pageError: string | null;
  refresh(): Promise<void>;
  loadMore(): Promise<void>;
}

/** The immutable scope identity a page belongs to. */
function financePagesKey(
  ownerId: string | null,
  scope: FinanceScope,
  extra: string,
): string {
  return [ownerId ?? "", scope.month, scope.apartmentId ?? "", extra].join("|");
}

/** Tracks the latest accepted snapshot per scope; snapshots from superseded
 *  keys never render, so route-scoped rows never leak across filters. */
interface FinanceTrail<Row, Cursor> {
  key: string;
  snapshot: FinancePagesSnapshot<Row, Cursor>;
}

function useFinancePages<Row, Cursor, Scope>(
  request: FinancePagesRequest<Scope>,
  enabled: boolean,
  ownerId: string | null,
  fetchPage: FinancePagesFetcher<Row, Cursor, Scope>,
): FinancePagesResult<Row> {
  const [trail, setTrail] = useState<FinanceTrail<Row, Cursor>>(() => ({
    key: "",
    snapshot: emptyFinancePages<Row, Cursor>(),
  }));

  const controller = useMemo(
    () =>
      createFinancePages<Row, Cursor, Scope>({
        apply: (key, snapshot) => setTrail({ key, snapshot }),
        toMessage: financeErrorMessage,
      }),
    [],
  );

  useEffect(() => {
    if (!enabled || !ownerId) {
      controller.reset();
      return;
    }
    void controller.open(request, fetchPage);
    return () => controller.reset();
  }, [controller, enabled, ownerId, request, fetchPage]);

  const refresh = useCallback(
    () => controller.refresh(fetchPage),
    [controller, fetchPage],
  );
  const loadMore = useCallback(
    () => controller.loadMore(fetchPage),
    [controller, fetchPage],
  );

  const snapshot =
    trail.key === request.key
      ? trail.snapshot
      : emptyFinancePages<Row, Cursor>();
  return {
    rows: snapshot.rows,
    hasMore: snapshot.next !== null,
    loading: trail.key !== request.key,
    loadingMore: snapshot.loadingMore,
    error: snapshot.error,
    pageError: snapshot.pageError,
    refresh,
    loadMore,
  };
}

/** The month's expenses with filter and keyset pagination (mobile mirror). */
export function useFinanceExpenses(
  ownerId: string | null,
  scope: FinanceScope,
  category: FinanceCategory | null,
  enabled: boolean,
): FinancePagesResult<ExpenseRecord> {
  const { month, apartmentId } = scope;
  const request = useMemo<FinancePagesRequest<FinanceScope>>(
    () => ({
      key: financePagesKey(ownerId, { month, apartmentId }, category ?? ""),
      scope: { month, apartmentId },
    }),
    [ownerId, month, apartmentId, category],
  );

  const fetchPage = useCallback(
    (pageScope: FinanceScope, cursor: ExpenseCursor | null) => {
      if (!ownerId) throw new Error(FINANCE_ACCESS_ERROR);
      return fetchExpensePage(ownerId, pageScope, category, cursor);
    },
    [ownerId, category],
  );

  return useFinancePages(request, enabled, ownerId, fetchPage);
}

/** The month's rental-period dues by collection status (mobile mirror). */
export function useFinanceCollections(
  ownerId: string | null,
  scope: FinanceScope,
  status: CollectionStatus,
  enabled: boolean,
): FinancePagesResult<RentLedgerRow> {
  const { month, apartmentId } = scope;
  const request = useMemo<FinancePagesRequest<FinanceScope>>(
    () => ({
      key: financePagesKey(ownerId, { month, apartmentId }, status),
      scope: { month, apartmentId },
    }),
    [ownerId, month, apartmentId, status],
  );

  const fetchPage = useCallback(
    async (pageScope: FinanceScope, cursor: string | null) => {
      if (!ownerId) throw new Error(FINANCE_ACCESS_ERROR);
      return fetchRentLedger(pageScope, status, cursor);
    },
    [ownerId, status],
  );

  return useFinancePages(request, enabled, ownerId, fetchPage);
}
