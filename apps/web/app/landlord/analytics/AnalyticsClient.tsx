"use client";

import { useMemo } from "react";
import { Button } from "@heroui/react";
import { IconChartBar, IconRefresh } from "@tabler/icons-react";

import { financeMonthLabel } from "@repo/utils";

import { useLandlordFinances } from "@/hooks/use-landlord-finances";
import { FINANCE_ACCESS_ERROR } from "@/lib/landlord-finance-access";
import type { LandlordFinanceRouteParams } from "@/lib/landlord-finance-params";
import type { FinanceScope } from "@/service/landlordFinanceService";

import AnalyticsSkeleton from "./components/AnalyticsSkeleton";

/**
 * Scoped composition for Profit & planning. Phase 2 wires the report and
 * applies the URL scope; the tab content (Overview, Expenses, Budget) mounts
 * here as each parity step lands, so this file stays the only finance state
 * hook entry on the page.
 */
export default function AnalyticsClient({ params }: { params: LandlordFinanceRouteParams }) {
  const finance = useLandlordFinances(
    useMemo<FinanceScope>(
      () => ({ month: params.month, apartmentId: params.apartmentId }),
      [params.month, params.apartmentId],
    ),
  );
  const report = finance.report;

  const appliedProperty = params.apartmentId
    ? (report.data.properties.find((property) => property.id === params.apartmentId)?.name ??
      "Selected property")
    : "All properties";

  const propertiesLine = report.data.properties.length
    ? `${report.data.properties.length} ${report.data.properties.length === 1 ? "property" : "properties"} in scope`
    : "No properties in scope yet";
  const windowLine = report.data.months.length
    ? `${report.data.months.length} months of plan window loaded`
    : "No plan window loaded yet";

  return (
    <div className="p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <IconChartBar size={28} aria-hidden="true" />
          </span>
          Profit &amp; planning
        </h1>
        <Button
          variant="outline"
          size="sm"
          isDisabled={!finance.enabled || report.loading}
          onPress={() => void report.refresh()}
          aria-label="Refresh the finance report"
        >
          <IconRefresh size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>
      <p className="mt-1 text-sm text-muted-foreground">
        {appliedProperty} · {financeMonthLabel(params.month)}
      </p>

      <section aria-label="Finance report" className="mt-5">
        {!finance.enabled ? (
          finance.userLoading ? (
            <AnalyticsSkeleton />
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              {FINANCE_ACCESS_ERROR}
            </div>
          )
        ) : report.error ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p>{report.error}</p>
            <Button
              className="mt-3"
              size="sm"
              onPress={() => void report.refresh()}
              aria-label="Retry loading the finance report"
            >
              Retry
            </Button>
          </div>
        ) : report.loading ? (
          <AnalyticsSkeleton />
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-medium text-foreground">Report ready</p>
            <p className="mt-2 text-muted-foreground">
              {propertiesLine} · {windowLine}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
