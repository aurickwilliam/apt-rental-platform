import { House, HandCoins, TrendingUp, PhilippinePeso } from "lucide-react";

import { formatPesoDisplay } from "@repo/utils";

import { getDashboardData } from "./lib/get-dashboard-data";
import RevenueChart from "./components/RevenueChart";
import RentDonut from "./components/RentDonut";
import OccupancyChart from "./components/OccupancyChart";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let data;
  try {
    data = await getDashboardData();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    if (message === "Not authenticated.") return <div>Not authenticated.</div>;
    return (
      <div className="p-4">
        <h1 className="text-5xl text-secondary font-bold font-noto-serif mb-1">
          Dashboard
        </h1>
        <div className="mt-4 p-3 bg-red-200 border border-red-400 rounded-lg text-sm text-red-600">
          Unable to load dashboard data: {message}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Properties",    value: String(data.totalProperties),                sublabel: undefined,    icon: House,          primary: true  },
    { label: "Total Revenue",       value: formatPesoDisplay(data.totalRevenueThisMonth), sublabel: "This month", icon: PhilippinePeso, primary: false },
    { label: "Occupancy Rate",      value: data.occupancyRate === null ? "—" : `${data.occupancyRate}%`, sublabel: undefined, icon: TrendingUp,      primary: false },
    { label: "Pending Payments",    value: String(data.pendingPayments),                sublabel: undefined,    icon: HandCoins,      primary: false },
  ];

  return (
    <div className="p-4">
      <h1 className="text-5xl text-secondary font-bold font-noto-serif mb-1">
        Dashboard
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        Welcome back! Here&apos;s an overview of your properties.
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, sublabel, value, icon: Icon, primary }) => (
          <div
            key={label}
            className={`p-4 flex flex-col gap-3 rounded-xl ${
              primary ? "bg-primary text-white" : "bg-white border border-grey-300"
            }`}
          >
            <div className="flex gap-3 items-center">
              <div className={`p-1.5 rounded-md ${primary ? "bg-white/20" : "bg-white border border-grey-300"}`}>
                <Icon className={primary ? "text-white" : "text-primary"} size={18} />
              </div>
              <div>
                <h2 className={`text-base font-medium font-noto-serif ${primary ? "text-white" : ""}`}>
                  {label}
                </h2>
                {sublabel && (
                  <p className={`text-xs ${primary ? "text-white/70" : "text-muted-foreground"}`}>
                    {sublabel}
                  </p>
                )}
              </div>
            </div>
            <p className={`text-3xl font-semibold ${primary ? "text-white" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">

        {/* Monthly Revenue Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-grey-300 rounded-xl p-4">
          <h3 className="text-base font-medium mb-4">Monthly Revenue</h3>
          <RevenueChart data={data.monthlyRevenue} />
        </div>

        {/* Rent Collection Donut */}
        <div className="bg-white border border-grey-300 rounded-xl p-4">
          <h3 className="text-base font-medium mb-4">Rent Collection</h3>
          <RentDonut data={data.rentCollection} hasPayments={data.hasPayments} />
        </div>

        {/* Occupancy Rate Area Chart */}
        <div className="lg:col-span-3 bg-white border border-grey-300 rounded-xl p-4">
          <h3 className="text-base font-medium mb-4">Occupancy Rate</h3>
          <OccupancyChart data={null} />
        </div>

      </div>
    </div>
  );
}
