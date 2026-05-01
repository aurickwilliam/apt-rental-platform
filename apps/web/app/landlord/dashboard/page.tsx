"use client";

import { House, HandCoins, TrendingUp, PhilippinePeso } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis,
  AreaChart, Area, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

import { COLORS } from "@repo/constants";

// --- Dummy Data ---
const MONTHLY_REVENUE = [
  { month: "Sep", revenue: 45000 },
  { month: "Oct", revenue: 52000 },
  { month: "Nov", revenue: 48000 },
  { month: "Dec", revenue: 61000 },
  { month: "Jan", revenue: 57000 },
  { month: "Feb", revenue: 63000 },
  { month: "Mar", revenue: 70000 },
];

const OCCUPANCY_RATE = [
  { month: "Sep", rate: 60 },
  { month: "Oct", rate: 70 },
  { month: "Nov", rate: 65 },
  { month: "Dec", rate: 80 },
  { month: "Jan", rate: 75 },
  { month: "Feb", rate: 85 },
  { month: "Mar", rate: 90 },
];

const RENT_COLLECTION = [
  { name: "paid",    label: "Paid",    value: 8  },
  { name: "pending", label: "Pending", value: 3  },
  { name: "overdue", label: "Overdue", value: 1  },
];

// --- Chart Configs ---
const revenueConfig = {
  revenue: { label: "Revenue", color: COLORS.primary },
} satisfies ChartConfig;

const occupancyConfig = {
  rate: { label: "Occupancy %", color: COLORS.primary },
} satisfies ChartConfig;

const rentConfig = {
  paid:    { label: "Paid",    color: COLORS.primary },
  pending: { label: "Pending", color: COLORS.secondary },
  overdue: { label: "Overdue", color: COLORS.redHead },
} satisfies ChartConfig;

// --- Stat Cards ---
const STATS = [
  { label: "Total Properties",    value: "12",      sublabel: undefined,       icon: House,            primary: true  },
  { label: "Total Revenue",       value: "₱ 70,000", sublabel: "This month",    icon: PhilippinePeso,   primary: false },
  { label: "Occupancy Rate",      value: "90%",     sublabel: undefined,       icon: TrendingUp,       primary: false },
  { label: "Pending Payments",    value: "3",       sublabel: undefined,       icon: HandCoins,        primary: false },
];

export default function Dashboard() {
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
        {STATS.map(({ label, sublabel, value, icon: Icon, primary }) => (
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
          <ChartContainer config={revenueConfig} className="h-[220px] w-full">
            <BarChart data={MONTHLY_REVENUE} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`₱${Number(value).toLocaleString()}`, "Revenue"]}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Rent Collection Donut */}
        <div className="bg-white border border-grey-300 rounded-xl p-4">
          <h3 className="text-base font-medium mb-4">Rent Collection</h3>
          <ChartContainer config={rentConfig} className="h-[220px] w-full">
            <PieChart>
              <Pie
                data={RENT_COLLECTION}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {RENT_COLLECTION.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={`var(--color-${entry.name})`}
                  />
                ))}
              </Pie>
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => [`${value} units`, ""]} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </div>

        {/* Occupancy Rate Area Chart */}
        <div className="lg:col-span-3 bg-white border border-grey-300 rounded-xl p-4">
          <h3 className="text-base font-medium mb-4">Occupancy Rate</h3>
          <ChartContainer config={occupancyConfig} className="h-[200px] w-full">
            <AreaChart data={OCCUPANCY_RATE}>
              <defs>
                <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--color-rate)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(value) => [`${value}%`, "Occupancy"]} />}
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--color-rate)"
                strokeWidth={2}
                fill="url(#occupancyGradient)"
                dot={{ fill: "var(--color-rate)", r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        </div>

      </div>
    </div>
  );
}
