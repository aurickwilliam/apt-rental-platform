"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { IconChevronLeft, IconPlus } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  type ExpenseRecord,
  type FinanceCategory,
  type FinanceScope,
} from "@repo/utils";

import {
  useFinanceAccess,
  useFinanceExpenses,
  useLandlordFinances,
} from "@/hooks/use-landlord-finances";
import {
  downloadCsv,
  expensesCsvFilename,
  expensesToCsv,
} from "@/lib/landlord-finance-export";
import {
  financeCategoryHref,
  financeReportHref,
  type FinanceCategoryRouteParams,
  type LandlordFinanceRouteParams,
} from "@/lib/landlord-finance-params";

import CategorySummaryCards from "../components/CategorySummaryCards";
import { FINANCE_CATEGORY_ICONS } from "../components/financeCategoryIcons";
import ExpenseEditorDrawer from "../components/ExpenseEditorDrawer";
import ExpenseTransactionsTable from "../components/ExpenseTransactionsTable";
import ReportControls from "../components/ReportControls";
import CategoryExpensesSkeleton from "./CategoryExpensesSkeleton";

function CategoryExpenses({
  params,
  currentMonth,
}: {
  params: FinanceCategoryRouteParams<FinanceCategory>;
  currentMonth: string;
}) {
  const router = useRouter();
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
  const [editor, setEditor] = useState<{ initial?: ExpenseRecord } | null>(
    null,
  );
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
    ? (data.properties.find((property) => property.id === params.apartmentId) ??
      null)
    : null;
  const rows = expenses.rows;
  const title = params.category
    ? financeCategoryLabel(params.category)
    : "Expense transactions";
  const ready = report.hasData && !!data.properties.length;
  const CategoryIcon = params.category
    ? FINANCE_CATEGORY_ICONS[params.category]
    : null;
  const changeScope = (patch: Partial<LandlordFinanceRouteParams>) => {
    if (finance.savingExpense.pending || finance.removingExpense.pending)
      return;
    close();
    const month = patch.month ?? params.month;
    const apartmentId =
      patch.apartmentId !== undefined ? patch.apartmentId : params.apartmentId;
    router.push(
      params.category
        ? financeCategoryHref(month, apartmentId, params.category)
        : financeReportHref(
            "",
            { month, apartmentId, tab: "expenses" },
            "/landlord/analytics/category-expenses",
          ),
      { scroll: false },
    );
  };
  const refresh = () => {
    void report.refresh();
    void expenses.refresh();
  };
  const exportExpenses = () =>
    downloadCsv(
      expensesCsvFilename(params.month, selectedProperty?.name ?? null),
      expensesToCsv(rows, {
        category: financeCategoryLabel,
        property: (id) =>
          data.properties.find((property) => property.id === id)?.name ??
          "Property",
      }),
    );

  return (
    <div className="finance-report space-y-4 p-4 md:p-6">
      <div data-fab-clearance>
        <Link
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          href={backHref}
        >
          <IconChevronLeft size={16} aria-hidden />
          Back to report
        </Link>
      </div>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          {CategoryIcon ? (
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <CategoryIcon size={28} aria-hidden />
            </span>
          ) : null}
          {title}
        </h1>
        <div data-fab-clearance>
          <Button
            size="sm"
            isDisabled={!ready}
            onPress={() => setEditor({})}
          >
            <IconPlus size={16} aria-hidden />
            Add expense
          </Button>
        </div>
      </header>
      <ReportControls
        properties={data.properties}
        scope={scope}
        currentMonth={currentMonth}
        disabled={!report.hasData}
        loading={finance.userLoading || report.initialLoading}
        refreshing={report.refreshing || expenses.loading}
        onChange={changeScope}
        onRefresh={refresh}
      />
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
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:items-start">
            <div className="order-2 min-w-0 lg:order-1">
              <ExpenseTransactionsTable
                scope={scope}
                properties={data.properties}
                expenses={expenses}
                category={params.category}
                onCategoryChange={() => undefined}
                showCategoryFilter={false}
                onEdit={(expense) => setEditor({ initial: expense })}
                onExport={exportExpenses}
              />
            </div>
            <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
              <CategorySummaryCards
                categories={data.categories}
                category={params.category}
                month={params.month}
                apartmentId={params.apartmentId}
              />
            </div>
          </div>
        </>
      )}
      {editor && report.hasData && data.properties.length ? (
        <ExpenseEditorDrawer
          month={params.month}
          properties={data.properties}
          apartmentId={params.apartmentId}
          initial={editor.initial}
          category={params.category}
          saving={finance.savingExpense}
          removing={finance.removingExpense}
          onSave={async (draft, editing) => {
            const ok = await finance.saveExpense(draft, editing);
            // The report reloads itself after a write; visible lists refresh
            // through their own handles.
            if (ok) void expenses.refresh();
            return ok;
          }}
          onDelete={
            editor.initial
              ? async (id) => {
                  const ok = await finance.removeExpense(id);
                  if (ok) void expenses.refresh();
                  return ok;
                }
              : undefined
          }
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
  currentMonth,
}: {
  params: FinanceCategoryRouteParams<FinanceCategory>;
  currentMonth: string;
}) {
  const identity = useFinanceAccess();
  return (
    <CategoryExpenses
      key={identity.enabled ? identity.ownerId : "unavailable"}
      params={params}
      currentMonth={currentMonth}
    />
  );
}
