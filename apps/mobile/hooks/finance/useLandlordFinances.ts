import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/auth";
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
} from "@/service/finance/financeService";
import type { FinanceBudget, FinanceCategory } from "@repo/utils";

export function useLandlordFinances(scope: FinanceScope) {
  const user = useCurrentUser();
  const client = useQueryClient();
  const ownerId = user.data?.id ?? null;
  const enabled =
    !!ownerId &&
    !!user.data?.roles?.includes("landlord") &&
    !user.data?.roles?.includes("admin");
  const key = [
    "landlord-finances",
    ownerId,
    scope.month,
    scope.apartmentId,
  ] as const;
  const report = useQuery({
    queryKey: key,
    queryFn: () => fetchFinances(scope),
    enabled,
  });
  const invalidate = async () => {
    // Writes can change two months, review flags and chart windows. Invalidate
    // this owner's finance family only, not another account or unrelated data.
    const queries = ["landlord-finances", "landlord-expenses"].flatMap(
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
    }) => saveExpense(ownerId!, draft, editing),
    onSuccess: invalidate,
  });
  const removeExpense = useMutation({
    mutationFn: (id: string) => deleteExpense(ownerId!, id),
    onSuccess: invalidate,
  });
  const budget = useMutation({
    mutationFn: (value: Omit<FinanceBudget, "id">) => saveBudget(value),
    onSuccess: invalidate,
  });
  const removeBudget = useMutation({
    mutationFn: (id: string) => deleteBudget(ownerId!, id),
    onSuccess: invalidate,
  });
  const review = useMutation({
    mutationFn: () => confirmExpenseReview(scope),
    onSuccess: invalidate,
  });
  const retry = () => (user.error ? user.refetch() : report.refetch());
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
