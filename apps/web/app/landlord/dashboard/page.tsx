import Link from "next/link";
import {
  IconAlertTriangle,
  IconCash,
  IconHome,
  IconTool,
} from "@tabler/icons-react";

import { buildRequestItems, formatPesoDisplay } from "@repo/utils";

import { getDashboardData } from "./lib/get-dashboard-data";
import CollectionCard from "./components/CollectionCard";
import StatTile from "./components/StatTile";
import RequestsCard from "./components/RequestsCard";
import RentDueList from "./components/RentDueList";
import RevenueChart from "./components/RevenueChart";
import PropertyRevenueChart from "./components/PropertyRevenueChart";
import ChartEmptyState from "./components/ChartEmptyState";
import DashboardHeader from "./components/DashboardHeader";

export const dynamic = "force-dynamic";

const MANILA_TIME_ZONE = "Asia/Manila";

export default async function Dashboard() {
  let data;
  try {
    data = await getDashboardData();
  } catch (err: unknown) {
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

  const { stats, attention, thisMonth, monthlyRevenue, revenueByProperty, rentDues } = data;

  if (stats.totalProperties === 0) {
    return (
      <div className="p-4 md:p-6">
        <DashboardHeader />
        <div className="space-y-3 rounded-xl border border-border bg-card py-16 text-center">
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
  const hasRevenue = monthlyRevenue.some((point) => point.amount > 0);
  // Comparing properties only makes sense with more than one.
  const showPropertyComparison = stats.totalProperties > 1;

  return (
    <div className="p-4 md:p-6">
      <DashboardHeader />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CollectionCard thisMonth={thisMonth} monthLabel={monthLabel} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatTile
            label="Overdue"
            icon={IconAlertTriangle}
            value={formatPesoDisplay(attention.overdueAmount) || "₱ 0"}
            caption={
              attention.overdueCount === 0
                ? "Nothing overdue"
                : `${attention.overdueCount} ${attention.overdueCount === 1 ? "payment" : "payments"}`
            }
            isAlert={attention.overdueCount > 0}
          />
          <StatTile
            label="Cash to confirm"
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
            label="Open maintenance"
            icon={IconTool}
            value={String(stats.maintenanceRequests)}
            caption={stats.maintenanceRequests === 0 ? "All clear" : "Requests to handle"}
            href={stats.maintenanceRequests > 0 ? "/landlord/maintenance-requests" : undefined}
          />
          <StatTile
            label="Occupancy"
            icon={IconHome}
            value={`${stats.unitsOccupied}/${stats.totalProperties}`}
            caption={stats.totalProperties === 1 ? "unit occupied" : "units occupied"}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <h3 className="mb-4 text-base font-medium text-foreground">Monthly Revenue</h3>
          {hasRevenue ? (
            <RevenueChart data={monthlyRevenue} />
          ) : (
            <ChartEmptyState
              title="No earnings yet"
              description="Once tenants start paying rent, your earnings will show up here."
            />
          )}
        </div>

        <div className="space-y-4">
          {requestItems.length > 0 ? <RequestsCard items={requestItems} /> : null}
          <RentDueList rentDues={rentDues} />
        </div>

        {showPropertyComparison && hasRevenue ? (
          <div className="rounded-xl border border-border bg-card p-4 lg:col-span-3">
            <h3 className="mb-4 text-base font-medium text-foreground">Revenue by Property</h3>
            <PropertyRevenueChart
              revenueByProperty={revenueByProperty}
              monthKeys={monthlyRevenue.map((point) => point.month)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
