"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { financeMonthLabel } from "@repo/utils";
import {
  useFinanceAccess,
  useLandlordFinances,
} from "@/hooks/use-landlord-finances";
import {
  financeReportHref,
  type LandlordFinanceRouteParams,
} from "@/lib/landlord-finance-params";
import PropertyPerformance from "../components/PropertyPerformance";
import PerformanceSkeleton from "./PerformanceSkeleton";

function Comparison({ params }: { params: LandlordFinanceRouteParams }) {
  const router = useRouter();
  const search = useSearchParams();
  // The full comparison deliberately reads all properties, not the report's
  // optional focus. The original URL focus is retained for Back to report.
  const finance = useLandlordFinances({
    month: params.month,
    apartmentId: null,
  });
  const { report } = finance;
  return (
    <div className="finance-report mx-auto max-w-7xl space-y-5 p-4 md:p-6">
      <Link
        className="text-sm text-brand underline"
        href={financeReportHref(search.toString(), params)}
      >
        Back to report
      </Link>
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="font-nunito text-3xl font-bold text-primary">
            Property performance
          </h1>
          <h2 className="mt-3 font-nunito text-lg font-bold">All properties</h2>
          <p className="text-sm text-muted-foreground">
            {financeMonthLabel(params.month)}
          </p>
        </div>
        <Button
          variant="outline"
          isDisabled={!finance.enabled || report.loading}
          isPending={report.refreshing}
          onPress={() => void report.refresh()}
        >
          Refresh
        </Button>
      </header>
      {finance.userLoading || report.initialLoading ? (
        <PerformanceSkeleton />
      ) : !finance.enabled ? (
        <p>Switch to your landlord portal to compare property performance.</p>
      ) : !report.hasData ? (
        <div role="alert" className="space-y-3">
          <p>{report.error ?? "Couldn’t load your finances."}</p>
          <Button onPress={() => void report.refresh()}>Try again</Button>
        </div>
      ) : !report.data.properties.length ? (
        <p>Add a property before comparing performance.</p>
      ) : (
        <>
          {report.error ? (
            <div role="alert">
              <p>{report.error} Previous figures are still shown.</p>
              <Button variant="secondary" onPress={() => void report.refresh()}>
                Retry comparison
              </Button>
            </div>
          ) : null}
          <PropertyPerformance
            full
            properties={report.data.performance}
            onSelect={(id) =>
              router.push(
                financeReportHref(search.toString(), {
                  month: params.month,
                  apartmentId: id,
                  tab: "overview",
                }),
              )
            }
          />
        </>
      )}
    </div>
  );
}

export default function PropertyPerformanceClient({
  params,
}: {
  params: LandlordFinanceRouteParams;
}) {
  const identity = useFinanceAccess();
  return (
    <Comparison
      key={identity.enabled ? identity.ownerId : "unavailable"}
      params={params}
    />
  );
}
