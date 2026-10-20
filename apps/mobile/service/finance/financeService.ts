import { supabase } from "@repo/supabase";
import {
  FINANCE_PAGE_SIZE,
  decodeFinanceReport,
  financeExpensePage,
  financeLedgerPage,
  shiftFinanceMonth,
  type CollectionStatus,
  type ExpenseCursor,
  type ExpenseDraft,
  type ExpenseRecord,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceData,
  type FinanceScope,
  type RentLedgerRow,
} from "@repo/utils";

// Payload types are the shared web/mobile contract in @repo/utils; the service
// keeps the transport and re-exports the names its components already import.
export type {
  CollectionStatus,
  ExpenseCursor,
  ExpenseDraft,
  ExpenseRecord,
  FinanceData,
  FinanceIncomeMonth,
  FinanceProperty,
  FinanceScope,
  PropertyPerformance,
  RentLedgerRow,
} from "@repo/utils";

export async function fetchFinances(scope: FinanceScope): Promise<FinanceData> {
  const { data, error } = await supabase.rpc("get_landlord_finances", {
    p_month: `${scope.month}-01`,
    p_apartment_id: scope.apartmentId ?? undefined,
  });
  if (error) throw error;
  return decodeFinanceReport(data);
}

export async function fetchExpensePage(
  ownerId: string,
  scope: FinanceScope,
  category: FinanceCategory | null,
  cursor: ExpenseCursor | null,
) {
  let query = supabase
    .from("landlord_expenses")
    .select(
      "id,apartment_id,category,treatment,amount,spent_on,description,apartments!inner(deleted_at)",
    )
    .eq("landlord_id", ownerId)
    .gte("spent_on", `${scope.month}-01`)
    .is("apartments.deleted_at", null)
    .lt("spent_on", `${shiftFinanceMonth(scope.month, 1)}-01`)
    .order("spent_on", { ascending: false })
    .order("id", { ascending: false })
    .limit(FINANCE_PAGE_SIZE + 1);
  if (scope.apartmentId) query = query.eq("apartment_id", scope.apartmentId);
  if (category) query = query.eq("category", category);
  if (cursor)
    query = query.or(
      `spent_on.lt.${cursor.spent_on},and(spent_on.eq.${cursor.spent_on},id.lt.${cursor.id})`,
    );
  const { data, error } = await query;
  if (error) throw error;
  return financeExpensePage(data as ExpenseRecord[] | null);
}

export async function saveExpense(
  ownerId: string,
  draft: ExpenseDraft,
  editing: boolean,
) {
  const { id, ...fields } = draft;
  const result = editing
    ? await supabase
        .from("landlord_expenses")
        .update({
          category: fields.category,
          treatment: fields.treatment,
          amount: fields.amount,
          spent_on: fields.spent_on,
          description: fields.description,
        })
        .eq("id", id)
        .eq("landlord_id", ownerId)
        .select("id")
        .single()
    : await supabase
        .from("landlord_expenses")
        .insert({ ...fields, id, landlord_id: ownerId })
        .select("id")
        .single();
  // A retry after an uncertain successful insert reuses the form UUID. If the
  // draft changed meanwhile, save those changes instead of silently losing them.
  if (!editing && result.error?.code === "23505") {
    const existing = await supabase
      .from("landlord_expenses")
      .select("apartment_id")
      .eq("id", id)
      .eq("landlord_id", ownerId)
      .single();
    if (!existing.error && existing.data.apartment_id === draft.apartment_id) {
      await saveExpense(ownerId, draft, true);
      return;
    }
  }
  if (result.error) throw result.error;
}

export async function deleteExpense(ownerId: string, id: string) {
  const { error } = await supabase
    .from("landlord_expenses")
    .delete()
    .eq("id", id)
    .eq("landlord_id", ownerId)
    .select("id")
    .single();
  if (error) throw error;
}

export async function saveBudget(budget: Omit<FinanceBudget, "id">) {
  const { error } = await supabase.rpc("save_landlord_finance_budget", {
    p_apartment_id: budget.apartment_id,
    p_month: `${budget.month.slice(0, 7)}-01`,
    p_category: budget.category,
    p_kind: budget.kind,
    p_amount: budget.amount,
    p_target_amount: budget.target_amount ?? undefined,
    p_months_remaining: budget.months_remaining ?? undefined,
  });
  if (error) throw error;
}

export async function deleteBudget(ownerId: string, id: string) {
  const { error } = await supabase
    .from("landlord_budgets")
    .delete()
    .eq("id", id)
    .eq("landlord_id", ownerId)
    .select("id")
    .single();
  if (error) throw error;
}

export async function confirmExpenseReview(scope: FinanceScope) {
  const { error } = await supabase.rpc("confirm_landlord_finance_month", {
    p_month: `${scope.month}-01`,
    p_apartment_id: scope.apartmentId ?? undefined,
  });
  if (error) throw error;
}

export async function fetchRentLedger(
  scope: FinanceScope,
  status: CollectionStatus,
  afterId: string | null,
) {
  let query = supabase
    .rpc("landlord_rent_ledger", {
      p_month: `${scope.month}-01`,
      p_apartment_id: scope.apartmentId ?? undefined,
    })
    .eq("status", status)
    .order("id")
    .limit(FINANCE_PAGE_SIZE + 1);
  if (afterId) query = query.gt("id", afterId);
  const { data, error } = await query;
  if (error) throw error;
  return financeLedgerPage(data as RentLedgerRow[] | null);
}

export function financeErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error.code === "PGRST202" || error.code === "42P01")
  ) {
    return "Finance tracking needs the latest database update. Please contact support.";
  }
  return "We couldn’t save or load your finances. Check your connection and try again.";
}
