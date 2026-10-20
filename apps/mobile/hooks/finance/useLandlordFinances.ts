import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/auth";
import { usePortalStore } from "@/stores/usePortalStore";
import { shiftFinanceMonth, financeIncomeMonthsFromReports, type FinanceBudget, type FinanceCategory } from "@repo/utils";
import {
  confirmExpenseReview,
  deleteBudget,
  deleteExpense,
  fetchExpensePage,
  fetchFinances,
  fetchRentLedger,
  saveBudget,
  saveExpense,
  type CollectionStatus,
  type ExpenseCursor,
  type ExpenseDraft,
  type FinanceScope,
  type FinanceIncomeMonth,
} from "@/service/finance/financeService";

function useFinanceAccess() {
  const user = useCurrentUser();
  const portal = usePortalStore((state) => state.portal);
  const authUserId = usePortalStore((state) => state.authUserId);
  const enabled =
    !!user.data?.id &&
    !!user.data?.roles?.includes("landlord") &&
    portal === "landlord" &&
    authUserId === user.data?.user_id;
  const ownerId = enabled ? user.data!.id : null;
  return { user, enabled, ownerId };
}

export function useLandlordFinances(scope: FinanceScope) {
  const { user, enabled, ownerId } = useFinanceAccess();
  const client = useQueryClient();
  const requireFinanceAccess = () => {
    if (!ownerId) throw new Error("Switch to your landlord portal to manage finances.");
    return ownerId;
  };
  const key = [
    "landlord-finances",
    ownerId,
    scope.month,
    scope.apartmentId,
  ] as const;
  const report = useQuery({
    queryKey: key,
    queryFn: () => {
      requireFinanceAccess();
      return fetchFinances(scope);
    },
    enabled,
  });
  const invalidate = async () => {
    // Writes can change two months, review flags and chart windows. Invalidate
    // this owner's finance family only, not another account or unrelated data.
    const queries = ["landlord-finances", "landlord-expenses", "landlord-finance-income-months"].flatMap(
      (family) =>
        client.getQueryCache().findAll({ queryKey: [family, ownerId] }),
    );
    await Promise.all(
      queries.map((query) =>
        client.invalidateQueries({ queryKey: query.queryKey, exact: true }),
      ),
    );
  };
  const expense = useMutation({
    mutationFn: ({
      draft,
      editing,
    }: {
      draft: ExpenseDraft;
      editing: boolean;
    }) => {
      return saveExpense(requireFinanceAccess(), draft, editing);
    },
    onSuccess: invalidate,
  });
  const removeExpense = useMutation({
    mutationFn: (id: string) => {
      return deleteExpense(requireFinanceAccess(), id);
    },
    onSuccess: invalidate,
  });
  const budget = useMutation({
    mutationFn: (value: Omit<FinanceBudget, "id">) => {
      requireFinanceAccess();
      return saveBudget(value);
    },
    onSuccess: invalidate,
  });
  const removeBudget = useMutation({
    mutationFn: (id: string) => {
      return deleteBudget(requireFinanceAccess(), id);
    },
    onSuccess: invalidate,
  });
  const review = useMutation({
    mutationFn: () => {
      requireFinanceAccess();
      return confirmExpenseReview(scope);
    },
    onSuccess: invalidate,
  });
  const retry = () => (user.error ? user.refetch() : enabled ? report.refetch() : undefined);
  return {
    report,
    expense,
    removeExpense,
    budget,
    removeBudget,
    review,
    ownerId,
    enabled,
    retry,
    userError: user.error,
    userLoading: user.isLoading,
  };
}

/** Load the picker for its draft property, independently of the applied report. */
export function useFinanceIncomeMonths(
  currentMonth: string,
  apartmentId: string | null,
  isOpen: boolean,
) {
  const { enabled, ownerId } = useFinanceAccess();
  const client = useQueryClient();
  return useQuery({
    queryKey: ["landlord-finance-income-months", ownerId, currentMonth, apartmentId],
    enabled: enabled && isOpen,
    queryFn: async (): Promise<FinanceIncomeMonth[]> => {
      if (!ownerId) throw new Error("Switch to your landlord portal to view finances.");
      const loadReport = (month: string) => client.fetchQuery({
        queryKey: ["landlord-finances", ownerId, month, apartmentId],
        queryFn: () => fetchFinances({ month, apartmentId }),
      });
      const latest = await loadReport(currentMonth);
      if (latest.incomeMonths) return latest.incomeMonths;
      // Older deployments return a 12-month chart only. Reuse two bounded,
      // cached reports to cover the picker without requiring a DB deployment.
      const earlier = await loadReport(shiftFinanceMonth(currentMonth, -12));
      return financeIncomeMonthsFromReports(earlier.months, latest.months);
    },
  });
}

export function useFinanceExpenses(
  ownerId: string | null,
  scope: FinanceScope,
  category: FinanceCategory | null,
  enabled: boolean,
) {
  return useInfiniteQuery({
    queryKey: [
      "landlord-expenses",
      ownerId,
      scope.month,
      scope.apartmentId,
      category,
    ],
    initialPageParam: null as ExpenseCursor | null,
    queryFn: ({ pageParam }) =>
      fetchExpensePage(ownerId!, scope, category, pageParam),
    getNextPageParam: (last) => last.next,
    enabled: !!ownerId && enabled,
  });
}

export function useFinanceCollections(
  ownerId: string | null,
  scope: FinanceScope,
  status: CollectionStatus,
  enabled: boolean,
) {
  return useInfiniteQuery({
    queryKey: [
      "landlord-collections",
      ownerId,
      scope.month,
      scope.apartmentId,
      status,
    ],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchRentLedger(scope, status, pageParam),
    getNextPageParam: (last) => last.next,
    enabled: !!ownerId && enabled,
  });
}
