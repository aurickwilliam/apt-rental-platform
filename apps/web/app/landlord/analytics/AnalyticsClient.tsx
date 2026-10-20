"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Tabs } from "@heroui/react";
import {
  IconChartBar,
  IconFilter2,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react";
import {
  financeMonthLabel,
  type CollectionStatus,
  type FinanceScope,
} from "@repo/utils";
import {
  useFinanceAccess,
  useLandlordFinances,
} from "@/hooks/use-landlord-finances";
import {
  financeCategoryHref,
  financeReportHref,
  type FinanceTab,
  type LandlordFinanceRouteParams,
} from "@/lib/landlord-finance-params";
import AnalyticsSkeleton from "./components/AnalyticsSkeleton";
import BudgetTab from "./components/BudgetTab";
import EarningsSummary from "./components/EarningsSummary";
import ExpenseEditorModal from "./components/ExpenseEditorModal";
import ExpensesTab from "./components/ExpensesTab";
import FinanceFilterModal from "./components/FinanceFilterModal";
import FinanceGuidelinesModal from "./components/FinanceGuidelinesModal";
import CollectionLedgerModal from "./components/CollectionLedgerModal";
import Overview from "./components/Overview";
import PlanBudgetModal from "./components/PlanBudgetModal";

interface AnalyticsClientProps {
  params: LandlordFinanceRouteParams;
  currentMonth: string;
}
type Overlay =
  | { scope: string; kind: "filters" | "guidelines" | "reserve" }
  | { scope: string; kind: "collections"; status: CollectionStatus }
  | { scope: string; kind: "expenseCreate" }
  | null;

function AnalyticsReport({ params, currentMonth }: AnalyticsClientProps) {
  const router = useRouter();
  const search = useSearchParams();
  const [applied, setApplied] = useOptimistic(params);
  const [navigating, startNavigation] = useTransition();
  const [overlay, setOverlay] = useState<Overlay>(null);
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
  const selectedProperty = data.properties.find(
    (property) => property.id === applied.apartmentId,
  );
  const propertyName = applied.apartmentId
    ? (selectedProperty?.name ?? "Selected property")
    : "All properties";
  const filterCount =
    Number(applied.apartmentId !== null) +
    Number(applied.month !== currentMonth);
  const activeOverlay = overlay?.scope === scopeKey ? overlay : null;
  const close = () => setOverlay(null);
  const open = (
    kind: "filters" | "guidelines" | "reserve" | "expenseCreate",
  ) => {
    if (kind === "reserve") finance.savingBudget.clearError();
    if (kind === "expenseCreate") {
      finance.savingExpense.clearError();
      finance.removingExpense.clearError();
    }
    setOverlay({ kind, scope: scopeKey });
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
  const expenses = (month?: string) =>
    navigate({ tab: "expenses", ...(month ? { month } : {}) });
  return (
    <div className="finance-report mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
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
            isDisabled={!finance.enabled || report.loading || navigating}
            isPending={report.refreshing}
            onPress={() => void report.refresh()}
          >
            <IconRefresh size={16} aria-hidden />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            isDisabled={!available || !data.properties.length || navigating}
            aria-expanded={activeOverlay?.kind === "filters"}
            aria-label={`Filters${filterCount ? ` (${filterCount})` : ""}, ${propertyName}, ${financeMonthLabel(applied.month)}`}
            onPress={() => open("filters")}
          >
            <IconFilter2 size={16} aria-hidden />
            Filters
            {filterCount ? (
              <span className="rounded-full bg-secondary px-2 text-secondary-foreground">
                {filterCount}
              </span>
            ) : null}
          </Button>
          <Button
            size="sm"
            isDisabled={!available || !data.properties.length || navigating}
            onPress={() => open("expenseCreate")}
          >
            <IconPlus size={16} aria-hidden />
            Add expense
          </Button>
        </div>
      </header>
      <div aria-live="polite">
        {applied.apartmentId ? (
          <p className="text-xs text-muted-foreground">Filtered property</p>
        ) : null}
        <h2 className="font-nunito text-lg font-bold">{propertyName}</h2>
        <p
          className="mt-1 text-sm text-muted-foreground"
          aria-label={`Report month: ${financeMonthLabel(applied.month)}`}
        >
          {financeMonthLabel(applied.month)}
        </p>
      </div>
      {finance.userLoading || report.initialLoading ? (
        <div role="status" aria-label="Loading finance report">
          <AnalyticsSkeleton />
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
          {report.refreshing ? (
            <p role="status" className="text-xs text-muted-foreground">
              Refreshing report…
            </p>
          ) : null}
          <EarningsSummary
            data={data}
            month={applied.month}
            currentMonth={currentMonth}
            onReview={() => expenses()}
            onGuidelines={() => open("guidelines")}
          />
          <Tabs
            selectedKey={applied.tab}
            onSelectionChange={(key) =>
              navigate({ tab: String(key) as FinanceTab })
            }
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Finance report tabs">
                <Tabs.Tab id="overview">
                  <span>Overview</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="expenses">
                  <span>Expenses</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="budget">
                  <span>Budget</span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel id="overview" className="pt-5">
              <Overview
                data={data}
                onExpenses={expenses}
                onBudgets={() => navigate({ tab: "budget" })}
                onReserve={() => open("reserve")}
                onCollection={(status) =>
                  setOverlay({ kind: "collections", status, scope: scopeKey })
                }
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
            </Tabs.Panel>
            <Tabs.Panel id="expenses" className="pt-5">
              <ExpensesTab
                data={data}
                scope={scope}
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
                onReview={finance.reviewExpenses}
                reviewing={finance.reviewing}
              />
            </Tabs.Panel>
            <Tabs.Panel id="budget" className="pt-5">
              <BudgetTab data={data} onReserve={() => open("reserve")} />
            </Tabs.Panel>
          </Tabs>
          <Button
            variant="ghost"
            size="sm"
            className="text-brand underline"
            onPress={() => open("guidelines")}
          >
            Planning guidelines
          </Button>
          {activeOverlay?.kind === "filters" ? (
            <FinanceFilterModal
              applied={scope}
              currentMonth={currentMonth}
              properties={data.properties}
              onClose={close}
              onApply={(next) => navigate(next)}
            />
          ) : null}
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
            <PlanBudgetModal
              scope={scope}
              properties={data.properties}
              presetCategory="emergency"
              presetKind="reserve"
              operation={finance.savingBudget}
              onSave={finance.saveBudget}
              onClose={close}
            />
          ) : null}
          {activeOverlay?.kind === "expenseCreate" ? (
            <ExpenseEditorModal
              month={scope.month}
              properties={data.properties}
              apartmentId={scope.apartmentId}
              saving={finance.savingExpense}
              removing={finance.removingExpense}
              onSave={finance.saveExpense}
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
