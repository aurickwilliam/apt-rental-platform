import {
  FINANCE_CATEGORIES,
  financeMonthFromParam,
  manilaToday,
  type FinanceCategory,
} from "@repo/utils";

import {
  parseFinanceCategoryParams,
  type SearchParamValue,
} from "@/lib/landlord-finance-params";
import { requireLandlordFinanceViewer } from "@/lib/landlord-finance-server";

import CategoryExpensesClient from "./CategoryExpensesClient";

interface CategoryExpensesPageProps {
  searchParams: Promise<Record<string, SearchParamValue>>;
}

/**
 * Server entry for one category's transactions: same access boundary as the
 * report, with the applied month/property/category parsed once from the URL.
 * Every shared category id is addressable, matching the mobile drill-down.
 */
export default async function CategoryExpensesPage({
  searchParams,
}: CategoryExpensesPageProps) {
  await requireLandlordFinanceViewer();
  const params = await searchParams;
  const currentMonth = manilaToday().slice(0, 7);
  const parsed = parseFinanceCategoryParams<FinanceCategory>(
    params,
    currentMonth,
    financeMonthFromParam,
    FINANCE_CATEGORIES.map((item) => item.id),
  );
  return (
    <CategoryExpensesClient params={parsed} currentMonth={currentMonth} />
  );
}
