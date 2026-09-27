"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { COLORS } from "@repo/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TrendPoint } from "../lib/get-dashboard-data";

interface QueueChartProps {
  users: number | null;
  apartments: number | null;
}

const queueConfig = {
  users: { label: "Users", color: "var(--primary)" },
  apartments: { label: "Apartments", color: COLORS.light.secondary },
} satisfies ChartConfig;

export function QueueChart({ users, apartments }: QueueChartProps) {
  if (users === null || apartments === null) return <p className="py-12 text-center text-sm text-muted-foreground">Queue totals unavailable.</p>;
  const total = users + apartments;
  const data = [{ name: "users", value: users }, { name: "apartments", value: apartments }];
  return (
    <div>
      {total ? (
        <div className="relative">
          <ChartContainer config={queueConfig} className="mx-auto h-48 w-full max-w-64">
            <PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={82} paddingAngle={3} stroke="none">
              {data.map((entry) => <Cell key={entry.name} fill={`var(--color-${entry.name})`} />)}
            </Pie><ChartTooltip content={<ChartTooltipContent />} /></PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="font-nunito text-3xl font-bold tabular-nums">{total}</span><span className="text-xs text-muted-foreground">pending</span></div>
        </div>
      ) : <p className="py-12 text-center text-sm text-muted-foreground">No pending reviews. All caught up!</p>}
      <ul className="mt-3 space-y-2 text-sm">
        <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary" />Users</span><strong className="font-nunito tabular-nums">{users}</strong></li>
        <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS.light.secondary }} />Apartments</span><strong className="font-nunito tabular-nums">{apartments}</strong></li>
      </ul>
      <p className="sr-only">{users} user verification requests and {apartments} apartment verification requests pending.</p>
    </div>
  );
}

type TrendKey = "users" | "apartments" | "reviews";
interface TrendChartProps {
  data: TrendPoint[];
  dataKey: TrendKey;
  title: string;
  description: string;
  variant?: "bar" | "area";
}

const trendConfig = {
  users: { label: "New users", color: "var(--primary)" },
  apartments: { label: "New apartments", color: "var(--primary)" },
  reviews: { label: "Completed reviews", color: "var(--primary)" },
} satisfies ChartConfig;

export function TrendChart({ data, dataKey, title, description, variant = "area" }: TrendChartProps) {
  const total = data.reduce((sum, point) => sum + point[dataKey], 0);
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5" aria-label={title}>
      <p className="font-nunito text-sm font-bold text-muted-foreground">{title}</p>
      <p className="mt-2 font-nunito text-3xl font-bold tabular-nums text-primary">{data.length ? total.toLocaleString("en-PH") : "—"}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      {data.length ? (
        <ChartContainer config={trendConfig} className="mt-4 h-40 w-full">
          {variant === "bar" ? (
            <BarChart data={data} accessibilityLayer><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11 }} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey={dataKey} fill={`var(--color-${dataKey})`} radius={[4, 4, 0, 0]} /></BarChart>
          ) : (
            <AreaChart data={data} accessibilityLayer><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} tick={{ fontSize: 11 }} /><ChartTooltip content={<ChartTooltipContent />} /><Area type="monotone" dataKey={dataKey} stroke={`var(--color-${dataKey})`} fill={`var(--color-${dataKey})`} fillOpacity={0.12} strokeWidth={2} /></AreaChart>
          )}
        </ChartContainer>
      ) : <p className="py-10 text-sm text-muted-foreground">Trend unavailable. Try refreshing.</p>}
      {data.length ? <p className="sr-only">{total} {title.toLowerCase()} in the selected reporting period.</p> : null}
    </section>
  );
}
