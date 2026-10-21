"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@heroui/react";
import { IconBook, IconChartBar, IconPlus } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  financeMonthLabel,
  type BudgetKind,
  type CollectionStatus,
  type ExpenseRecord,
  type FinanceBudget,
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
  financeBudgetCategoryHref,
  financeCategoryHref,
  financeReportHref,
  type LandlordFinanceRouteParams,
} from "@/lib/landlord-finance-params";
import AnalyticsSkeleton from "./components/AnalyticsSkeleton";
import { BudgetAside, BudgetMain } from "./components/BudgetTab";
import EarningsSummary from "./components/EarningsSummary";
import ExpenseEditorDrawer from "./components/ExpenseEditorDrawer";
import { ExpensesAside, ExpensesMain } from "./components/ExpensesTab";
import FinanceGuidelinesModal from "./components/FinanceGuidelinesModal";
import CollectionLedgerModal from "./components/CollectionLedgerModal";
import NeedsAttention from "./components/NeedsAttention";
import { OverviewAside, OverviewMain } from "./components/Overview";
import PlanBudgetDrawer from "./components/PlanBudgetDrawer";
import ReportControls from "./components/ReportControls";

interface AnalyticsClientProps {
  params: LandlordFinanceRouteParams;
  currentMonth: string;
}
type Overlay =
  | { scope: string; kind: "guidelines" | "reserve" }
  | { scope: string; kind: "collections"; status: CollectionStatus }
  | { scope: string; kind: "expenseCreate" }
  | { scope: string; kind: "expenseEdit"; initial: ExpenseRecord }
  | {
      scope: string;
      kind: "budget";
      /** A saved plan turns the modal into the edit form. */
      initial?: FinanceBudget;
      /** A suggestion's monthly amount, offered for review before saving. */
      suggestedAmount?: number;
      presetCategory?: FinanceCategory;
      presetKind?: BudgetKind;
    }
  | null;

function AnalyticsReport({ params, currentMonth }: AnalyticsClientProps) {
  const router = useRouter();
  const search = useSearchParams();
  const [applied, setApplied] = useOptimistic(params);
  const [navigating, startNavigation] = useTransition();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [expenseCategory, setExpenseCategory] =
    useState<FinanceCategory | null>(null);
  // Only the Refresh button swaps the report for placeholders; the reloads that
  // follow a save stay quiet so closing a drawer never flashes the page.
  const [manualRefresh, setManualRefresh] = useState(false);
  const scope: FinanceScope = {
    month: applied.month,
    apartmentId: applied.apartmentId,
  };
  const scopeKey = JSON.stringify([
    scope.month,
    scope.apartmentId,
    applied.tab,
  ]);
  const finance = useLandlordFinances(scope);
  const { report } = finance;
  const { data } = report;
  const available = report.hasData && !!data.months.length;
  const expenses = useFinanceExpenses(
    finance.ownerId,
    scope,
    expenseCategory,
    Boolean(finance.ownerId) && available && applied.tab === "expenses",
  );
  const selectedProperty = data.properties.find(
    (property) => property.id === applied.apartmentId,
  );
  const propertyName = applied.apartmentId
    ? (selectedProperty?.name ?? "Selected property")
    : "All properties";
  const activeOverlay = overlay?.scope === scopeKey ? overlay : null;
  const close = () => setOverlay(null);
  const open = (kind: "guidelines" | "reserve" | "expenseCreate") => {
    if (kind === "reserve") finance.savingBudget.clearError();
    if (kind === "expenseCreate") {
      finance.savingExpense.clearError();
      finance.removingExpense.clearError();
    }
    setOverlay({ kind, scope: scopeKey });
  };
  const openExpenseEdit = (initial: ExpenseRecord) => {
    finance.savingExpense.clearError();
    finance.removingExpense.clearError();
    setOverlay({ kind: "expenseEdit", scope: scopeKey, initial });
  };
  /** One plan form for create and edit, mirroring mobile's budget entry page. */
  const openBudget = (
    options: {
      initial?: FinanceBudget;
      suggestedAmount?: number;
      presetCategory?: FinanceCategory;
      presetKind?: BudgetKind;
    } = {},
  ) => {
    finance.savingBudget.clearError();
    finance.removingBudget.clearError();
    setOverlay({ kind: "budget", scope: scopeKey, ...options });
  };
  const navigate = (patch: Partial<LandlordFinanceRouteParams>) => {
    if (
      finance.savingBudget.pending ||
      finance.savingExpense.pending ||
      finance.removingExpense.pending ||
      finance.reviewing.pending
    )
      return;
    close();
    startNavigation(() => {
      setApplied({ ...applied, ...patch });
      router.push(
        financeReportHref(search.toString(), { ...applied, ...patch }),
        { scroll: false },
      );
    });
  };
  const goToExpenses = (month?: string) =>
    navigate({ tab: "expenses", ...(month ? { month } : {}) });
  const propertyLabel = (id: string) =>
    data.properties.find((property) => property.id === id)?.name ?? "Property";
  const exportExpenses = () =>
    downloadCsv(
      expensesCsvFilename(scope.month, selectedProperty?.name ?? null),
      expensesToCsv(expenses.rows, {
        category: financeCategoryLabel,
        property: propertyLabel,
      }),
    );
  const refreshReport = async () => {
    setManualRefresh(true);
    try {
      await Promise.all([
        report.refresh(),
        applied.tab === "expenses" ? expenses.refresh() : undefined,
      ]);
    } finally {
      setManualRefresh(false);
    }
  };
  const onBudgetTab = applied.tab === "budget";
  const ready = available && !!data.properties.length && !navigating;
  return (
    <div className="finance-report space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <IconChartBar size={28} aria-hidden />
          </span>
          Profit &amp; planning
        </h1>
        <div className="flex flex-wrap gap-2" data-fab-clearance>
          <Button
            variant="outline"
            size="sm"
            isDisabled={!available || navigating}
            onPress={() => open("guidelines")}
          >
            <IconBook size={16} aria-hidden />
            Guidelines
          </Button>
          <Button
            size="sm"
            isDisabled={!ready}
            onPress={() => (onBudgetTab ? openBudget() : open("expenseCreate"))}
          >
            <IconPlus size={16} aria-hidden />
            {onBudgetTab ? "Add budget" : "Add expense"}
          </Button>
        </div>
      </header>
      <ReportControls
        properties={data.properties}
        scope={scope}
        currentMonth={currentMonth}
        tab={applied.tab}
        disabled={!available || navigating}
        loading={finance.userLoading || report.initialLoading}
        refreshing={report.refreshing}
        onChange={navigate}
        onRefresh={() => void refreshReport()}
      />
      <p className="sr-only" aria-live="polite">
        {propertyName}, {financeMonthLabel(applied.month)}
      </p>
      {finance.userLoading || report.initialLoading ? (
        <div role="status" aria-label="Loading finance report">
          <AnalyticsSkeleton tab={applied.tab} />
        </div>
      ) : !finance.enabled ? (
        <div className="py-12 text-center">
          <h2 className="font-nunito text-xl font-bold">
            Finances unavailable
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Switch to your landlord portal to view and manage finances for your
            properties.
          </p>
        </div>
      ) : !available ? (
        <div className="space-y-3 py-12 text-center" role="alert">
          <h2 className="font-nunito text-xl font-bold">
            Couldn’t load your finances
          </h2>
          <p className="text-sm text-muted-foreground">
            {report.error ?? "The finance report could not be read."}
          </p>
          <Button variant="secondary" onPress={() => void report.refresh()}>
            Try again
          </Button>
        </div>
      ) : !data.properties.length ? (
        <div className="space-y-3 py-12 text-center">
          <h2 className="font-nunito text-xl font-bold">
            Add your first property
          </h2>
          <p className="text-sm text-muted-foreground">
            Your rental finances and plans will appear here.
          </p>
          <Link
            className="text-brand underline"
            href="/landlord/properties/create"
          >
            Create a property
          </Link>
        </div>
      ) : applied.apartmentId && !selectedProperty ? (
        <div className="space-y-3" role="alert">
          <p>This property is no longer available in your report.</p>
          <Button onPress={() => navigate({ apartmentId: null })}>
            Show all properties
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
          {report.refreshing && !manualRefresh ? (
            <p role="status" className="text-xs text-muted-foreground">
              Refreshing report…
            </p>
          ) : null}
          {manualRefresh ? (
            <div role="status" aria-label="Loading finance report">
              <AnalyticsSkeleton tab={applied.tab} />
            </div>
          ) : (
            <div
              role="tabpanel"
              aria-label={`${applied.tab} report`}
              className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)] lg:items-start"
            >
              <div className="max-lg:contents flex min-w-0 flex-col gap-4">
                <div className="order-2 min-w-0">
                  <EarningsSummary
                    data={data}
                    month={applied.month}
                    currentMonth={currentMonth}
                    onReview={() => goToExpenses()}
                    onGuidelines={() => open("guidelines")}
                  />
                </div>
                <div className="order-3 flex min-w-0 flex-col gap-4">
                  {applied.tab === "overview" ? (
                    <OverviewMain
                      data={data}
                      onExpenses={goToExpenses}
                      onProperty={(id) => navigate({ apartmentId: id })}
                      onViewAll={() =>
                        router.push(
                          financeReportHref(
                            search.toString(),
                            applied,
                            "/landlord/analytics/property-performance",
                          ),
                        )
                      }
                    />
                  ) : null}
                  {applied.tab === "expenses" ? (
                    <ExpensesMain
                      data={data}
                      scope={scope}
                      expenses={expenses}
                      category={expenseCategory}
                      onCategoryChange={setExpenseCategory}
                      onEdit={openExpenseEdit}
                      onExport={exportExpenses}
                      onReview={finance.reviewExpenses}
                      reviewing={finance.reviewing}
                    />
                  ) : null}
                  {applied.tab === "budget" ? (
                    <BudgetMain
                      data={data}
                      properties={data.properties}
                      onSelectGroup={(category, kind) =>
                        router.push(
                          financeBudgetCategoryHref(
                            applied.month,
                            applied.apartmentId,
                            category,
                            kind,
                          ),
                          { scroll: false },
                        )
                      }
                      onCreate={(presetCategory, presetKind) =>
                        openBudget({ presetCategory, presetKind })
                      }
                      onEdit={(budget, suggestedAmount) =>
                        openBudget({ initial: budget, suggestedAmount })
                      }
                    />
                  ) : null}
                </div>
              </div>
              <div className="max-lg:contents flex min-w-0 flex-col gap-4">
                <div className="order-1 min-w-0">
                  <NeedsAttention
                    data={data}
                    month={applied.month}
                    onCollection={(status) =>
                      setOverlay({
                        kind: "collections",
                        status,
                        scope: scopeKey,
                      })
                    }
                    onExpenses={() => goToExpenses()}
                    onBudgets={() => navigate({ tab: "budget" })}
                    onReserve={() => open("reserve")}
                  />
                </div>
                <div className="order-4 flex min-w-0 flex-col gap-4">
                  {applied.tab === "overview" ? (
                    <OverviewAside
                      data={data}
                      onBudgets={() => navigate({ tab: "budget" })}
                      onCollection={(status) =>
                        setOverlay({
                          kind: "collections",
                          status,
                          scope: scopeKey,
                        })
                      }
                    />
                  ) : null}
                  {applied.tab === "expenses" ? (
                    <ExpensesAside
                      data={data}
                      onSelectCategory={(category) =>
                        router.push(
                          financeCategoryHref(
                            applied.month,
                            applied.apartmentId,
                            category,
                          ),
                          { scroll: false },
                        )
                      }
                    />
                  ) : null}
                  {applied.tab === "budget" ? (
                    <BudgetAside
                      data={data}
                      properties={data.properties}
                      onCreate={(presetCategory, presetKind) =>
                        openBudget({ presetCategory, presetKind })
                      }
                      onEdit={(budget, suggestedAmount) =>
                        openBudget({ initial: budget, suggestedAmount })
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          )}
          {activeOverlay?.kind === "guidelines" ? (
            <FinanceGuidelinesModal onClose={close} />
          ) : null}
          {activeOverlay?.kind === "collections" && finance.ownerId ? (
            <CollectionLedgerModal
              ownerId={finance.ownerId}
              scope={scope}
              initialStatus={activeOverlay.status}
              onClose={close}
            />
          ) : null}
          {activeOverlay?.kind === "reserve" ? (
            <PlanBudgetDrawer
              scope={scope}
              properties={data.properties}
              presetCategory="emergency"
              presetKind="reserve"
              operation={finance.savingBudget}
              onSave={finance.saveBudget}
              onClose={close}
            />
          ) : null}
          {activeOverlay?.kind === "expenseCreate" ||
          activeOverlay?.kind === "expenseEdit" ? (
            <ExpenseEditorDrawer
              month={scope.month}
              properties={data.properties}
              apartmentId={scope.apartmentId}
              initial={
                activeOverlay.kind === "expenseEdit"
                  ? activeOverlay.initial
                  : undefined
              }
              saving={finance.savingExpense}
              removing={finance.removingExpense}
              onSave={async (draft, editing) => {
                const ok = await finance.saveExpense(draft, editing);
                // The report reloads itself after a write; the visible list
                // refreshes through its own handle.
                if (ok && applied.tab === "expenses") void expenses.refresh();
                return ok;
              }}
              onDelete={
                activeOverlay.kind === "expenseEdit"
                  ? async (id) => {
                      const ok = await finance.removeExpense(id);
                      if (ok && applied.tab === "expenses")
                        void expenses.refresh();
                      return ok;
                    }
                  : undefined
              }
              onClose={close}
            />
          ) : null}
          {activeOverlay?.kind === "budget" ? (
            <PlanBudgetDrawer
              scope={scope}
              properties={data.properties}
              presetCategory={activeOverlay.presetCategory}
              presetKind={activeOverlay.presetKind}
              initial={activeOverlay.initial}
              suggestedAmount={activeOverlay.suggestedAmount}
              operation={finance.savingBudget}
              removing={finance.removingBudget}
              onSave={finance.saveBudget}
              onDelete={
                activeOverlay.initial ? finance.removeBudget : undefined
              }
              onClose={close}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export default function AnalyticsClient(props: AnalyticsClientProps) {
  const identity = useFinanceAccess();
  // Only account identity remounts the report. Filters stay URL-backed and do
  // not remount it; account loss immediately removes modals and sensitive rows.
  return (
    <AnalyticsReport
      key={identity.enabled ? identity.ownerId : "unavailable"}
      {...props}
    />
  );
}
