"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { IconRefresh, IconTargetArrow } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  financeMonthLabel,
  formatPesoDisplay,
  type FinanceBudget,
  type FinanceCategory,
  type FinanceScope,
} from "@repo/utils";

import {
  useFinanceAccess,
  useLandlordFinances,
} from "@/hooks/use-landlord-finances";
import {
  financeReportHref,
  type FinanceBudgetCategoryRouteParams,
} from "@/lib/landlord-finance-params";

import BudgetProgressRow from "../components/BudgetProgressRow";
import FinanceMoneyRow from "../components/FinanceMoneyRow";
import PlanBudgetDrawer from "../components/PlanBudgetDrawer";
import BudgetCategorySkeleton from "./BudgetCategorySkeleton";

const KIND_TITLES = {
  expense: "Spending limits",
  reserve: "Planned reserves",
} as const;

function BudgetCategory({
  params,
}: {
  params: FinanceBudgetCategoryRouteParams<FinanceCategory>;
}) {
  const search = useSearchParams();
  const scope: FinanceScope = {
    month: params.month,
    apartmentId: params.apartmentId,
  };
  const finance = useLandlordFinances(scope);
  const { report } = finance;
  const { data } = report;
  const [editor, setEditor] = useState<FinanceBudget | null>(null);
  const backParams = new URLSearchParams(search.toString());
  // The drill-down owns these keys; returning to the tab must not carry them.
  backParams.delete("category");
  backParams.delete("kind");
  const backHref = financeReportHref(backParams.toString(), {
    month: params.month,
    apartmentId: params.apartmentId,
    tab: "budget",
  });
  const propertyName = (apartmentId: string) =>
    data.properties.find((property) => property.id === apartmentId)?.name ??
    "Property";
  const selectedProperty = report.hasData
    ? (data.properties.find(
        (property) => property.id === params.apartmentId,
      ) ?? null)
    : null;
  const rows = report.hasData
    ? data.budgets
        .filter(
          (budget) =>
            budget.category === params.category &&
            budget.kind === params.kind,
        )
        .sort((a, b) =>
          propertyName(a.apartment_id).localeCompare(
            propertyName(b.apartment_id),
          ),
        )
    : [];
  const totalAmount = rows.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = rows.reduce((sum, budget) => sum + budget.spent, 0);
  const propertyCount = `${rows.length} ${rows.length === 1 ? "property" : "properties"}`;
  // A plan removed while its editor is open must not come back as a new plan.
  const planMissing =
    !!editor &&
    report.hasData &&
    !data.budgets.some((budget) => budget.id === editor.id);
  const title = params.category
    ? financeCategoryLabel(params.category)
    : "Budget plan";

  return (
    <div className="finance-report mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        data-fab-clearance
      >
        <Link className="text-sm text-brand underline" href={backHref}>
          <span aria-hidden>‹ </span>Back to budgets
        </Link>
        <Button
          variant="outline"
          size="sm"
          isDisabled={!finance.enabled || report.refreshing}
          isPending={report.refreshing}
          onPress={() => void report.refresh()}
        >
          <IconRefresh size={16} aria-hidden />
          Refresh
        </Button>
      </div>
      <header>
        <h1 className="font-nunito text-3xl font-bold text-primary">{title}</h1>
        <h2 className="mt-2 font-nunito text-lg font-bold">
          {selectedProperty?.name ?? "All properties"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {KIND_TITLES[params.kind]} · {financeMonthLabel(params.month)}
        </p>
      </header>
      {finance.userLoading || report.initialLoading ? (
        <BudgetCategorySkeleton />
      ) : !finance.enabled ? (
        <div className="space-y-2 py-8 text-center" role="alert">
          <p>Switch to your landlord portal to view these budgets.</p>
        </div>
      ) : !report.hasData ? (
        <div className="space-y-3 py-8 text-center" role="alert">
          <p>{report.error ?? "Couldn't load your finances."}</p>
          <Button variant="secondary" onPress={() => void report.refresh()}>
            Try again
          </Button>
        </div>
      ) : !params.category ? (
        <div className="space-y-3 py-8 text-center" role="alert">
          <IconTargetArrow
            size={32}
            className="mx-auto text-muted-foreground"
            aria-hidden
          />
          <h2 className="font-nunito font-bold">Budget category not found</h2>
          <p className="text-sm text-muted-foreground">
            Open the Budget tab and choose a category to see its properties.
          </p>
          <Link className="text-sm text-brand underline" href={backHref}>
            Back to budgets
          </Link>
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
          {rows.length ? (
            <p className="text-sm text-muted-foreground">
              {params.kind === "expense"
                ? `${formatPesoDisplay(totalSpent)} spent of ${formatPesoDisplay(totalAmount)} across ${propertyCount}`
                : `${formatPesoDisplay(totalAmount)} planned across ${propertyCount}`}
            </p>
          ) : null}
          <div className="space-y-3">
            {rows.map((budget) =>
              budget.kind === "reserve" ? (
                <Button
                  key={budget.id}
                  variant="ghost"
                  className="h-auto w-full items-stretch whitespace-normal py-2 text-left"
                  aria-label={`${propertyName(budget.apartment_id)}, planned ${formatPesoDisplay(budget.amount)} this month. Edit budget`}
                  onPress={() => setEditor(budget)}
                >
                  <div className="w-full space-y-1 text-left">
                    <FinanceMoneyRow
                      label={propertyName(budget.apartment_id)}
                      amount={budget.amount}
                    />
                    <p className="text-xs text-muted-foreground">
                      planned this month
                    </p>
                  </div>
                </Button>
              ) : (
                <BudgetProgressRow
                  key={budget.id}
                  title={propertyName(budget.apartment_id)}
                  caption="spent this month"
                  amount={budget.amount}
                  spent={budget.spent}
                  action="Edit budget"
                  onPress={() => setEditor(budget)}
                />
              ),
            )}
            {!rows.length ? (
              <div className="space-y-1 py-8 text-center" role="alert">
                <IconTargetArrow
                  size={32}
                  className="mx-auto text-muted-foreground"
                  aria-hidden
                />
                <h2 className="font-nunito font-bold">
                  {params.kind === "reserve"
                    ? "No reserve goals in this category"
                    : "No spending limits in this category"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Nothing planned for {financeMonthLabel(params.month)}
                  {selectedProperty ? ` for ${selectedProperty.name}` : ""}.
                </p>
              </div>
            ) : null}
          </div>
        </>
      )}
      {editor && report.hasData && data.properties.length ? (
        planMissing ? (
          <div className="space-y-3 py-8 text-center" role="alert">
            <IconTargetArrow
              size={32}
              className="mx-auto text-muted-foreground"
              aria-hidden
            />
            <h2 className="font-nunito font-bold">Budget not found</h2>
            <p className="text-sm text-muted-foreground">
              This plan is no longer part of {financeMonthLabel(params.month)}
              &apos;s report. Open the Budget tab and choose a plan to change.
            </p>
            <Link className="text-sm text-brand underline" href={backHref}>
              Back to budgets
            </Link>
          </div>
        ) : (
          <PlanBudgetDrawer
            scope={scope}
            properties={data.properties}
            initial={editor}
            operation={finance.savingBudget}
            removing={finance.removingBudget}
            onSave={finance.saveBudget}
            onDelete={finance.removeBudget}
            onClose={() => setEditor(null)}
          />
        )
      ) : null}
    </div>
  );
}

/**
 * One active editor with account-scoped identity: access changes remount the
 * list and discard open editors and drafts, as on mobile.
 */
export default function BudgetCategoryClient({
  params,
}: {
  params: FinanceBudgetCategoryRouteParams<FinanceCategory>;
}) {
  const identity = useFinanceAccess();
  return (
    <BudgetCategory
      key={identity.enabled ? identity.ownerId : "unavailable"}
      params={params}
    />
  );
}
