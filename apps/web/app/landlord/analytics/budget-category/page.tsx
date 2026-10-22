import {
  FINANCE_CATEGORIES,
  financeMonthFromParam,
  manilaToday,
  type FinanceCategory,
} from "@repo/utils";

import {
  parseFinanceBudgetParams,
  type SearchParamValue,
} from "@/lib/landlord-finance-params";
import { requireLandlordFinanceViewer } from "@/lib/landlord-finance-server";

import BudgetCategoryClient from "./BudgetCategoryClient";

interface BudgetCategoryPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

/**
 * Server entry for one budget category's properties: same access boundary as
 * the report, with the applied month/property/category/kind parsed once from
 * the URL. An unknown kind reads as spending limits, like the mobile route.
 */
export default async function BudgetCategoryPage({
  searchParams,
}: BudgetCategoryPageProps) {
  await requireLandlordFinanceViewer();
  const params = await searchParams;
  const parsed = parseFinanceBudgetParams<FinanceCategory>(
    params,
    manilaToday().slice(0, 7),
    financeMonthFromParam,
    FINANCE_CATEGORIES.map((item) => item.id),
  );
  return <BudgetCategoryClient params={parsed} />;
}
