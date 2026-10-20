import { createRoot } from "react-dom/client";
import AnalyticsClient from "../../app/landlord/analytics/AnalyticsClient";
import PropertyPerformanceClient from "../../app/landlord/analytics/property-performance/PropertyPerformanceClient";
import { financeMonthFromParam } from "@repo/utils";
import { parseLandlordFinanceParams } from "../../lib/landlord-finance-params";
import { currentMonth } from "./fixture-service";
import { useFixtureUrl } from "./fixture-navigation";

function FixtureApp() {
  const url = useFixtureUrl();
  const params = parseLandlordFinanceParams(
    Object.fromEntries(new URLSearchParams(url.split("?")[1] ?? "")),
    currentMonth,
    financeMonthFromParam,
  );
  return url.startsWith("/landlord/analytics/property-performance") ? (
    <PropertyPerformanceClient params={params} />
  ) : (
    <AnalyticsClient params={params} currentMonth={currentMonth} />
  );
}
createRoot(document.getElementById("root")).render(<FixtureApp />);
