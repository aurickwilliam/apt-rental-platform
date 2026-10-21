"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { IconRefresh, IconReceipt2 } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  financeMonthLabel,
  type FinanceCategory,
  type FinanceScope,
} from "@repo/utils";

import {
  useFinanceAccess,
  useFinanceExpenses,
  useLandlordFinances,
} from "@/hooks/use-landlord-finances";
import {
  financeReportHref,
  type FinanceCategoryRouteParams,
} from "@/lib/landlord-finance-params";
import type { ExpenseRecord } from "@/service/landlordFinanceService";

import ExpenseEditorDrawer from "../components/ExpenseEditorDrawer";
import ExpenseTransactionRow from "../components/ExpenseTransactionRow";
import CategoryExpensesSkeleton from "./CategoryExpensesSkeleton";

function CategoryExpenses({
  params,
}: {
  params: FinanceCategoryRouteParams<FinanceCategory>;
}) {
  const search = useSearchParams();
  const scope: FinanceScope = {
    month: params.month,
    apartmentId: params.apartmentId,
  };
  const finance = useLandlordFinances(scope);
  const { report } = finance;
  const { data } = report;
  // Like the mobile screen, the list loads beside its report instead of
  // behind it; the report gates names, labels and access wording.
  const expenses = useFinanceExpenses(
    finance.ownerId,
    scope,
    params.category,
    Boolean(finance.ownerId),
  );
  const [pending, startPending] = useTransition();
  const [editor, setEditor] = useState<{
    initial?: ExpenseRecord;
  } | null>(null);
  const close = () => setEditor(null);
  const backParams = new URLSearchParams(search.toString());
  // The drill-down owns category; returning to the report must not carry it.
  backParams.delete("category");
  const backHref = financeReportHref(backParams.toString(), {
    month: params.month,
    apartmentId: params.apartmentId,
    tab: "expenses",
  });
  const selectedProperty = report.hasData
    ? (data.properties.find(
        (property) => property.id === params.apartmentId,
      ) ?? null)
    : null;
  const rows = expenses.rows;
  const title = params.category
    ? financeCategoryLabel(params.category)
    : "Expense transactions";

  const runPending = (action: () => Promise<void>) => {
    startPending(async () => {
      await action();
    });
  };

  return (
    <div className="finance-report space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3" data-fab-clearance>
        <Link className="text-sm text-brand underline" href={backHref}>
          <span aria-hidden>‹ </span>Back to report
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            isDisabled={!finance.enabled || report.refreshing}
            isPending={report.refreshing}
            onPress={() => void report.refresh()}
          >
            <IconRefresh size={16} aria-hidden />
            Refresh report
          </Button>
          <Button
            variant="outline"
            size="sm"
            isDisabled={pending}
            onPress={() => runPending(expenses.refresh)}
          >
            Refresh expenses
          </Button>
        </div>
      </div>
      <header>
        <h1 className="font-nunito text-3xl font-bold text-primary">{title}</h1>
        <h2 className="mt-2 font-nunito text-lg font-bold">
          {selectedProperty?.name ?? "All properties"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {financeMonthLabel(params.month)}
        </p>
      </header>
      {finance.userLoading || report.initialLoading ? (
        <CategoryExpensesSkeleton />
      ) : !finance.enabled ? (
        <div className="space-y-2 py-8 text-center" role="alert">
          <p>Switch to your landlord portal to view these expenses.</p>
        </div>
      ) : !report.hasData ? (
        <div className="space-y-3 py-8 text-center" role="alert">
          <p>{report.error ?? "Couldn't load your finances."}</p>
          <Button variant="secondary" onPress={() => void report.refresh()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          {report.error ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3 text-sm"
            >
              <p>{report.error} Your previous figures remain visible.</p>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => void report.refresh()}
              >
                Retry report
              </Button>
            </div>
          ) : null}
          <div className="space-y-3" aria-live="polite">
            {rows.map((expense) => (
              <ExpenseTransactionRow
                key={expense.id}
                expense={expense}
                propertyName={
                  params.apartmentId
                    ? undefined
                    : (data.properties.find(
                        (property) => property.id === expense.apartment_id,
                      )?.name ?? undefined)
                }
                onPress={() => setEditor({ initial: expense })}
              />
            ))}
            {expenses.loading && !rows.length ? (
              <CategoryExpensesSkeleton />
            ) : null}
            {!rows.length && !expenses.loading && !expenses.error ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <IconReceipt2
                  size={32}
                  className="text-muted-foreground"
                  aria-hidden
                />
                <h3 className="font-nunito font-bold">
                  {params.category
                    ? "No expenses in this category"
                    : "No expenses recorded"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Nothing recorded in {financeMonthLabel(params.month)}
                  {selectedProperty ? ` for ${selectedProperty.name}` : ""}.
                </p>
              </div>
            ) : null}
            {expenses.error ? (
              <div className="space-y-2 py-4 text-center" role="alert">
                <p className="text-sm">{expenses.error}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  isDisabled={pending}
                  onPress={() => runPending(expenses.refresh)}
                >
                  Retry
                </Button>
              </div>
            ) : null}
            {expenses.pageError ? (
              <p role="alert" className="text-sm">
                {expenses.pageError} Your loaded rows are still here. Try Load
                more again.
              </p>
            ) : null}
            {expenses.hasMore ? (
              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  isDisabled={pending}
                  onPress={() => runPending(expenses.loadMore)}
                >
                  {expenses.loadingMore && pending
                    ? "Loading…"
                    : "Load more expenses"}
                </Button>
              </div>
            ) : null}
          </div>
        </>
      )}
      {editor && report.hasData && data.properties.length ? (
        <ExpenseEditorDrawer
          month={params.month}
          properties={data.properties}
          apartmentId={params.apartmentId}
          initial={editor.initial}
          saving={finance.savingExpense}
          removing={finance.removingExpense}
          onSave={async (draft, editing) => {
            const ok = await finance.saveExpense(draft, editing);
            // The report reloads itself after a write; visible lists refresh
            // through their own handles.
            if (ok) void expenses.refresh();
            return ok;
          }}
          onDelete={async (id) => {
            const ok = await finance.removeExpense(id);
            if (ok) void expenses.refresh();
            return ok;
          }}
          onClose={close}
        />
      ) : null}
    </div>
  );
}

/**
 * One active editor with account-scoped identity: access changes remount the
 * list and discard open editors and drafts, as on mobile.
 */
export default function CategoryExpensesClient({
  params,
}: {
  params: FinanceCategoryRouteParams<FinanceCategory>;
}) {
  const identity = useFinanceAccess();
  return (
    <CategoryExpenses
      key={identity.enabled ? identity.ownerId : "unavailable"}
      params={params}
    />
  );
}
