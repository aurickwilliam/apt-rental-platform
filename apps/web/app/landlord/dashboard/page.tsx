import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { IconAlertTriangle, IconCash, IconHome, IconTool } from "@tabler/icons-react";

import { buildRequestItems, formatPesoDisplay } from "@repo/utils";

import { getDashboardData } from "./lib/get-dashboard-data";
import CollectionCard from "./components/CollectionCard";
import StatTile from "./components/StatTile";
import RequestsCard from "./components/RequestsCard";
import RentDueList from "./components/RentDueList";
import ProfitTrendChart from "./components/ProfitTrendChart";
import CollectionHistoryChart from "./components/CollectionHistoryChart";
import DashboardHeader from "./components/DashboardHeader";

export const dynamic = "force-dynamic";

const MANILA_TIME_ZONE = "Asia/Manila";

const PESO_WHOLE = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default async function Dashboard() {
  let data;
  try {
    data = await getDashboardData();
  } catch (err: unknown) {
    unstable_rethrow(err);
    const message = err instanceof Error ? err.message : "Something went wrong.";
    if (message === "Not authenticated.") return <div>Not authenticated.</div>;
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-5xl text-brand font-bold font-noto-serif mb-1">
          Dashboard
        </h1>
        <div className="mt-4 p-3 bg-red-200 border border-red-400 rounded-lg text-sm text-red-600">
          Unable to load dashboard data: {message}
        </div>
      </div>
    );
  }

  const { stats, attention, thisMonth, collectionByMonth, monthlyRevenue, rentDues } = data;

  if (stats.totalProperties === 0) {
    return (
      <div className="p-4 md:p-6">
        <DashboardHeader />
        <div className="space-y-3 rounded-3xl border border-border bg-card py-16 text-center">
          <h2 className="font-nunito text-xl font-bold">No properties yet</h2>
          <p className="text-sm text-muted-foreground">
            Add your first property to start managing your rentals.
          </p>
          <Link
            className="cursor-pointer text-brand underline"
            href="/landlord/properties/create"
          >
            Create a property
          </Link>
        </div>
      </div>
    );
  }

  const monthLabel = new Date().toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: MANILA_TIME_ZONE,
  });
  const requestItems = buildRequestItems(attention);
  const occupancyPercent =
    stats.totalProperties > 0
      ? Math.round((stats.unitsOccupied / stats.totalProperties) * 100)
      : 0;

  return (
    <div className="p-4 md:p-6">
      <DashboardHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CollectionCard
          className="lg:col-span-2"
          thisMonth={thisMonth}
          monthLabel={monthLabel}
        />
        <RequestsCard items={requestItems} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Overdue Rent"
          icon={IconAlertTriangle}
          value={PESO_WHOLE.format(attention.overdueAmount)}
          caption={
            attention.overdueCount === 0
              ? "Nothing overdue"
              : `${attention.overdueCount} ${attention.overdueCount === 1 ? "payment" : "payments"}`
          }
          isAlert={attention.overdueCount > 0}
        />
        <StatTile
          label="Cash to Confirm"
          icon={IconCash}
          value={String(attention.pendingCashCount)}
          caption={
            attention.pendingCashCount === 0
              ? "All confirmed"
              : formatPesoDisplay(attention.pendingCashAmount)
          }
          href={attention.pendingCashCount > 0 ? "/landlord/payments" : undefined}
        />
        <StatTile
          label="Open Maintenance"
          icon={IconTool}
          value={String(stats.maintenanceRequests)}
          caption={stats.maintenanceRequests === 0 ? "All clear" : "Requests to handle"}
          href={stats.maintenanceRequests > 0 ? "/landlord/maintenance-requests" : undefined}
        />
        <StatTile
          label="Occupancy"
          icon={IconHome}
          value={`${stats.unitsOccupied} / ${stats.totalProperties}`}
          caption={`${occupancyPercent}% occupied`}
          progress={occupancyPercent}
          progressLabel="Units occupied"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProfitTrendChart data={monthlyRevenue} className="lg:col-span-2" />
        <RentDueList rentDues={rentDues} />

        <CollectionHistoryChart data={collectionByMonth} className="lg:col-span-3" />
      </div>
    </div>
  );
}
