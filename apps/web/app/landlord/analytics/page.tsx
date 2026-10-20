import { financeMonthFromParam, manilaToday } from "@repo/utils";

import { parseLandlordFinanceParams } from "@/lib/landlord-finance-params";
import { requireLandlordFinanceViewer } from "@/lib/landlord-finance-server";

import AnalyticsClient from "./AnalyticsClient";

interface ProfitAnalyticsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Server entry for Profit & planning: the guard blocks anyone without finance
 * access, and the applied scope (month/property/tab) is parsed once here so
 * the URL stays the validated source of truth. Form drafts never enter the
 * route; filters update it as applied scope.
 */
export default async function ProfitAnalyticsPage({
  searchParams,
}: ProfitAnalyticsPageProps) {
  await requireLandlordFinanceViewer();
  const params = await searchParams;
  const currentMonth = manilaToday().slice(0, 7);
  const applied = parseLandlordFinanceParams(
    params,
    currentMonth,
    financeMonthFromParam,
  );
  return <AnalyticsClient params={applied} currentMonth={currentMonth} />;
}
