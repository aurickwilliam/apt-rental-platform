import { createRoot } from "react-dom/client";
import { Toast } from "@heroui/react";
import AnalyticsClient from "../../app/landlord/analytics/AnalyticsClient";
import CategoryExpensesClient from "../../app/landlord/analytics/category-expenses/CategoryExpensesClient";
import PropertyPerformanceClient from "../../app/landlord/analytics/property-performance/PropertyPerformanceClient";
import {
  FINANCE_CATEGORIES,
  financeMonthFromParam,
} from "@repo/utils";
import {
  parseFinanceCategoryParams,
  parseLandlordFinanceParams,
} from "../../lib/landlord-finance-params";
import { currentMonth } from "./fixture-service";
import { useFixtureUrl } from "./fixture-navigation";

function FixtureApp() {
  const url = useFixtureUrl();
  const query = url.split("?")[1] ?? "";
  const searchParams = Object.fromEntries(new URLSearchParams(query));
  if (url.startsWith("/landlord/analytics/category-expenses")) {
    // The server page revalidates through the shared rule; the fixture runs
    // the same parse so the visible list stays true to the route contract.
    return (
      <CategoryExpensesClient
        params={parseFinanceCategoryParams(
          searchParams,
          currentMonth,
          financeMonthFromParam,
          FINANCE_CATEGORIES.map((item) => item.id),
        )}
      />
    );
  }
  const params = parseLandlordFinanceParams(
    searchParams,
    currentMonth,
    financeMonthFromParam,
  );
  return url.startsWith("/landlord/analytics/property-performance") ? (
    <PropertyPerformanceClient params={params} />
  ) : (
    <AnalyticsClient params={params} currentMonth={currentMonth} />
  );
}
createRoot(document.getElementById("root")).render(
  <>
    <FixtureApp />
    {/* The app root mounts this in app/providers.tsx; toasts need the region. */}
    <Toast.Provider
      placement="top end"
      maxVisibleToasts={3}
      className="top-4 right-4"
    />
  </>,
);
