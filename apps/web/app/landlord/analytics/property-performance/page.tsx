import { financeMonthFromParam, manilaToday } from "@repo/utils";
import {
  parseLandlordFinanceParams,
  type SearchParamValue,
} from "@/lib/landlord-finance-params";
import { requireLandlordFinanceViewer } from "@/lib/landlord-finance-server";
import PropertyPerformanceClient from "./PropertyPerformanceClient";

export default async function PropertyPerformancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, SearchParamValue>>;
}) {
  await requireLandlordFinanceViewer();
  const params = parseLandlordFinanceParams(
    await searchParams,
    manilaToday().slice(0, 7),
    financeMonthFromParam,
  );
  return <PropertyPerformanceClient params={params} />;
}
