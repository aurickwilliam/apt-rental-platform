"use client";

import Link from "next/link";
import { Card } from "@heroui/react";
import {
  IconBuilding,
  IconFileText,
  IconLayoutDashboard,
  IconShieldCheck,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { CAMANAVA_CITIES, COLORS } from "@repo/constants";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface AnalyticsMetrics {
  users: {
    total: number;
    new: number;
    newTenants: number;
    newLandlords: number;
    tenants: number;
    landlords: number;
    verified: number;
    suspended: number;
  };
  apartments: {
    total: number;
    new: number;
    hidden: number;
    verified: number;
    available: number;
  };
  userVerifications: { pending: number; approved: number; rejected: number };
  apartmentVerifications: {
    pending: number;
    approved: number;
    rejected: number;
  };
  applications: { new: number; approved: number };
  tenancies: { new: number; active: number; occupiedUnits: number };
  payments: { paidCount: number; paidTotal: number };
  maintenance: {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    cancelled: number;
  };
}

export interface AnalyticsTrend {
  bucket_start: string;
  bucket_end: string;
  users: number;
  apartments: number;
  tenants: number;
  landlords: number;
}

export interface PaymentTrend {
  bucket_start: string;
  bucket_end: string;
  payment_total: number;
  payment_count: number;
}

export interface ListingStatus {
  total: number;
  available: number;
  occupied: number;
  hidden: number;
  pending_verification: number;
  other: number;
}

export interface ListingCityCount {
  city: string;
  listing_count: number;
}

export interface ApplicationStatusCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  closed: number;
}

interface AnalyticsPanelsProps {
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrend[] | null;
  paymentTrends: PaymentTrend[] | null;
  listingStatus: ListingStatus | null;
  listingsByCity: ListingCityCount[] | null;
  applicationStatus: ApplicationStatusCounts | null;
  from: string;
  to: string;
}

const growthConfig = {
  users: { label: "New users", color: "var(--primary)" },
  apartments: { label: "New listings", color: COLORS.light.secondary },
} satisfies ChartConfig;

const roleConfig = {
  tenants: { label: "Tenant", color: "var(--primary)" },
  landlords: { label: "Landlord", color: COLORS.light.secondary },
} satisfies ChartConfig;

const reviewConfig = {
  approved: { label: "Approved · in period", color: COLORS.light.success },
  rejected: { label: "Rejected · in period", color: "var(--destructive)" },
  pending: { label: "Pending · now", color: COLORS.light.warning },
} satisfies ChartConfig;

const applicationConfig = {
  value: { label: "Count", color: "var(--primary)" },
} satisfies ChartConfig;

const paymentConfig = {
  payment_total: {
    label: "Successful payment volume",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

const maintenanceConfig = {
  pending: { label: "Pending", color: COLORS.light.warning },
  inProgress: { label: "In progress", color: "var(--primary)" },
  resolved: { label: "Resolved", color: COLORS.light.success },
  cancelled: { label: "Cancelled", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const listingConfig = {
  available: { label: "Available", color: COLORS.light.success },
  occupied: { label: "Occupied", color: "var(--primary)" },
  hidden: { label: "Hidden", color: "var(--destructive)" },
  pending_verification: { label: "Pending verification", color: COLORS.light.warning },
  other: { label: "Other", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

const cityConfig = {
  value: { label: "Listings", color: "var(--primary)" },
} satisfies ChartConfig;

const applicationStatusConfig = {
  pending: { label: "Pending", color: COLORS.light.warning },
  approved: { label: "Approved", color: COLORS.light.success },
  rejected: { label: "Rejected", color: "var(--destructive)" },
  cancelled: { label: "Cancelled", color: "var(--muted-foreground)" },
  closed: { label: "Closed", color: "var(--foreground)" },
} satisfies ChartConfig;

const numberFormat = new Intl.NumberFormat("en-PH");
const percentFormat = new Intl.NumberFormat("en-PH", {
  style: "percent",
  maximumFractionDigits: 1,
});
const moneyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});
const compactMoneyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const fullDateFormat = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function shortDate(date: string): string {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

function bucketDateLabel(
  row: Pick<AnalyticsTrend, "bucket_start" | "bucket_end"> | undefined,
): string {
  if (!row) return "";
  const start = fullDateFormat.format(
    new Date(`${row.bucket_start}T00:00:00Z`),
  );
  if (row.bucket_start === row.bucket_end) return start;
  const end = fullDateFormat.format(new Date(`${row.bucket_end}T00:00:00Z`));
  return `${start} – ${end}`;
}

function Panel({
  title,
  description,
  children,
  className = "",
  headerAccessory,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  headerAccessory?: React.ReactNode;
}) {
  return (
    <Card
      className={`h-full min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5 ${className}`}
    >
      <Card.Content className="p-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-nunito text-lg font-bold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {headerAccessory}
        </div>
        {children}
      </Card.Content>
    </Card>
  );
}

function SectionHeading({
  id,
  title,
  icon: Icon,
}: {
  id: string;
  title: string;
  icon: typeof IconBuilding;
}) {
  return (
    <h2 id={id} className="flex items-center gap-2 font-nunito text-xl font-bold">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon size={20} className="text-primary" aria-hidden="true" />
      </span>
      {title}
    </h2>
  );
}

function AnalyticsSection({
  id,
  title,
  icon,
  children,
  gridClassName = "lg:grid-cols-2",
}: {
  id: string;
  title: string;
  icon: typeof IconBuilding;
  children: React.ReactNode;
  gridClassName?: string;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <SectionHeading id={id} title={title} icon={icon} />
      <div className={`grid grid-cols-1 gap-4 ${gridClassName}`}>{children}</div>
    </section>
  );
}

function SnapshotCard({
  title,
  value,
  valueLabel,
  detail,
}: {
  title: string;
  value: number;
  valueLabel?: string;
  detail: React.ReactNode;
}) {
  return (
    <Card className="h-full min-w-0 rounded-3xl border border-border bg-card p-4 shadow-none">
      <Card.Content className="flex h-full flex-col justify-between gap-4 p-0">
        <div>
          <dt className="font-nunito text-sm font-bold text-foreground">
            {title}
          </dt>
          <dd className="mt-2 font-nunito text-3xl font-bold tabular-nums text-primary">
            {numberFormat.format(value)}
            {valueLabel ? (
              <span className="ml-1 text-sm font-semibold text-muted-foreground">
                {valueLabel}
              </span>
            ) : null}
          </dd>
        </div>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </Card.Content>
    </Card>
  );
}

interface StatusDonutProps {
  data: { name: string; value: number }[];
  config: ChartConfig;
  total: number;
  centerLabel: string;
  showPercent?: boolean;
  className?: string;
  chartClassName?: string;
}

function StatusDonut({
  data,
  config,
  total,
  centerLabel,
  showPercent = false,
  className = "",
  chartClassName = "",
}: StatusDonutProps) {
  return (
    <div className={`mt-4 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10 ${className}`}>
      <div className={`relative size-52 shrink-0 ${chartClassName}`}>
        <ChartContainer config={config} className="size-full">
          <PieChart accessibilityLayer>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={72} stroke="none">
              {data.map((item) => (
                <Cell key={item.name} fill={`var(--color-${item.name})`} />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{config[name]?.label}</span>
                      <span className="font-mono font-medium tabular-nums text-foreground">
                        {numberFormat.format(Number(value))} ({percentFormat.format(Number(value) / total)})
                      </span>
                    </span>
                  )}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-nunito text-3xl font-bold tabular-nums text-foreground">
            {numberFormat.format(total)}
          </span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <dl className="w-full max-w-64 space-y-2 text-sm">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-6">
            <dt className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: config[item.name]?.color }} />
              {config[item.name]?.label}
            </dt>
            <dd className="font-nunito font-bold tabular-nums">
              {numberFormat.format(item.value)}
              {showPercent ? <span className="ml-1 text-xs font-normal text-muted-foreground">{percentFormat.format(item.value / total)}</span> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function AnalyticsPanels({
  metrics,
  trends,
  paymentTrends,
  listingStatus,
  listingsByCity,
  applicationStatus,
  from,
  to,
}: AnalyticsPanelsProps) {
  const reviews = [
    {
      name: "Account verification",
      approved: metrics.userVerifications.approved,
      rejected: metrics.userVerifications.rejected,
      pending: metrics.userVerifications.pending,
    },
    {
      name: "Listing verification",
      approved: metrics.apartmentVerifications.approved,
      rejected: metrics.apartmentVerifications.rejected,
      pending: metrics.apartmentVerifications.pending,
    },
  ];
  const applicationActivity = [
    {
      name: "Applications submitted",
      value: metrics.applications.new,
      scope: "Period",
    },
    {
      name: "Approved applications",
      value: metrics.applications.approved,
      scope: "Period",
    },
    { name: "New tenancies", value: metrics.tenancies.new, scope: "Period" },
    {
      name: "Active tenancies",
      value: metrics.tenancies.active,
      scope: "Current",
    },
  ];
  const maintenance = [
    { name: "pending", value: metrics.maintenance.pending },
    { name: "inProgress", value: metrics.maintenance.inProgress },
    { name: "resolved", value: metrics.maintenance.resolved },
    { name: "cancelled", value: metrics.maintenance.cancelled },
  ];
  const listingSlices = listingStatus ? [
    { name: "available", value: listingStatus.available },
    { name: "occupied", value: listingStatus.occupied },
    { name: "hidden", value: listingStatus.hidden },
    { name: "pending_verification", value: listingStatus.pending_verification },
    ...(listingStatus.other ? [{ name: "other", value: listingStatus.other }] : []),
  ] : [];
  const cityCounts = new Map(listingsByCity?.map((row) => [row.city, row.listing_count]));
  const cityBars = CAMANAVA_CITIES.map((name) => ({
    name,
    value: cityCounts.get(name) ?? 0,
  })).sort((a, b) => b.value - a.value);
  const unmatchedCityCount = cityCounts.get("Other") ?? 0;
  const applicationSlices = applicationStatus ? [
    { name: "pending", value: applicationStatus.pending },
    { name: "approved", value: applicationStatus.approved },
    { name: "rejected", value: applicationStatus.rejected },
    { name: "cancelled", value: applicationStatus.cancelled },
    ...(applicationStatus.closed ? [{ name: "closed", value: applicationStatus.closed }] : []),
  ] : [];
  const pendingVerifications =
    metrics.userVerifications.pending + metrics.apartmentVerifications.pending;
  const period = `${fullDateFormat.format(new Date(`${from}T00:00:00Z`))} – ${fullDateFormat.format(new Date(`${to}T00:00:00Z`))}`;
  const paymentTotal =
    paymentTrends?.reduce((sum, bucket) => sum + bucket.payment_total, 0) ?? 0;
  const paymentCount =
    paymentTrends?.reduce((sum, bucket) => sum + bucket.payment_count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <section aria-labelledby="snapshot-heading" className="space-y-3">
        <SectionHeading id="snapshot-heading" title="Current Snapshot" icon={IconLayoutDashboard} />
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <SnapshotCard
            title="Users"
            value={metrics.users.total}
            detail={`${numberFormat.format(metrics.users.tenants)} tenants · ${numberFormat.format(metrics.users.landlords)} landlords now`}
          />
          <SnapshotCard
            title="Listings"
            value={metrics.apartments.total}
            detail={`${numberFormat.format(metrics.apartments.available)} available · ${numberFormat.format(metrics.tenancies.occupiedUnits)} occupied units now`}
          />
          <SnapshotCard
            title="Active tenancies"
            value={metrics.tenancies.active}
            detail={`${numberFormat.format(metrics.tenancies.new)} new this period`}
          />
          <SnapshotCard
            title="Verification"
            value={metrics.apartments.verified}
            valueLabel="verified listings"
            detail={`${numberFormat.format(metrics.users.verified)} verified users · ${numberFormat.format(pendingVerifications)} pending now`}
          />
        </dl>
      </section>

      <AnalyticsSection id="growth-heading" title="Growth" icon={IconTrendingUp} gridClassName="grid-cols-1">
        <Panel
          title="Platform Growth"
          description="New accounts and listings during the selected reporting period."
          headerAccessory={
            <div
              className="flex flex-wrap gap-x-4 gap-y-1 font-nunito text-sm font-bold text-primary"
              aria-label="Growth totals for this period"
            >
              <span>
                {numberFormat.format(metrics.users.new)} new{" "}
                {metrics.users.new === 1 ? "user" : "users"}
              </span>
              <span>
                {numberFormat.format(metrics.apartments.new)} new{" "}
                {metrics.apartments.new === 1 ? "listing" : "listings"}
              </span>
            </div>
          }
        >
          <p className="mt-2 text-xs text-muted-foreground">{period} (UTC)</p>
          {trends?.length ? (
            <>
              <ChartContainer
                config={growthConfig}
                className="mt-4 h-64 w-full sm:h-72"
              >
                <LineChart
                  data={trends}
                  accessibilityLayer
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="bucket_start"
                    tickFormatter={shortDate}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)" }}
                    content={
                      <ChartTooltipContent
                        formatter={(value, _name, item) => (
                          <span className="flex w-full items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              {
                                growthConfig[
                                  item.dataKey as keyof typeof growthConfig
                                ]?.label
                              }
                            </span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {numberFormat.format(Number(value))}
                            </span>
                          </span>
                        )}
                        labelFormatter={(_, payload) => {
                          const row = payload[0]?.payload as
                            AnalyticsTrend | undefined;
                          return bucketDateLabel(row);
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="users"
                    name="New users"
                    type="linear"
                    stroke="var(--color-users)"
                    strokeWidth={2}
                    dot={trends.length === 1}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    dataKey="apartments"
                    name="New listings"
                    type="linear"
                    stroke="var(--color-apartments)"
                    strokeWidth={2}
                    dot={trends.length === 1}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
              <p className="sr-only">
                {trends
                  .map(
                    (point) =>
                      `${shortDate(point.bucket_start)} to ${shortDate(point.bucket_end)}: ${point.users} users, ${point.apartments} listings.`,
                  )
                  .join(" ")}
              </p>
            </>
          ) : (
            <p
              className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
              role="status"
            >
              {trends === null
                ? "Growth trend unavailable; period totals are shown above."
                : "No growth data for this period."}
            </p>
          )}
        </Panel>

        <Panel
          title="New Users by Role"
          description="New registrations grouped by their current roles."
          headerAccessory={
            <div
              className="flex flex-wrap gap-x-4 gap-y-1 font-nunito text-sm font-bold text-primary"
              aria-label="New registrations by role this period"
            >
              <span>
                {numberFormat.format(metrics.users.newTenants)} tenant
              </span>
              <span>
                {numberFormat.format(metrics.users.newLandlords)} landlord
              </span>
            </div>
          }
        >
          <p className="mt-2 text-xs text-muted-foreground">
            {period} (UTC) · Users with multiple roles may appear in more than
            one category.
          </p>
          {trends?.length ? (
            <>
              <ChartContainer
                config={roleConfig}
                className="mt-4 h-64 w-full sm:h-72"
              >
                <BarChart
                  data={trends}
                  accessibilityLayer
                  margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="bucket_start"
                    tickFormatter={shortDate}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          bucketDateLabel(
                            payload[0]?.payload as AnalyticsTrend | undefined,
                          )
                        }
                        formatter={(value, _name, item) => (
                          <span className="flex w-full items-center justify-between gap-4">
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              {
                                roleConfig[
                                  item.dataKey as keyof typeof roleConfig
                                ]?.label
                              }
                            </span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              {numberFormat.format(Number(value))}
                            </span>
                          </span>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="tenants"
                    name="Tenant"
                    stackId="roles"
                    fill="var(--color-tenants)"
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey="landlords"
                    name="Landlord"
                    stackId="roles"
                    fill="var(--color-landlords)"
                    maxBarSize={24}
                  />
                </BarChart>
              </ChartContainer>
              <p className="sr-only">
                {trends
                  .map(
                    (point) =>
                      `${bucketDateLabel(point)}: ${point.tenants} tenants, ${point.landlords} landlords.`,
                  )
                  .join(" ")}
              </p>
            </>
          ) : (
            <p
              className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
              role="status"
            >
              {trends === null
                ? "Role trend unavailable; period totals are shown above."
                : "No registration data for this period."}
            </p>
          )}
        </Panel>

      </AnalyticsSection>

      <AnalyticsSection id="rental-activity-heading" title="Verification and Rental Activity" icon={IconShieldCheck}>

        <Panel
          title="Verification Activity"
          description="Approved and rejected in the selected period · pending in the queue now"
        >
          {reviews.some(
            (row) => row.approved + row.rejected + row.pending > 0,
          ) ? (
            <ChartContainer config={reviewConfig} className="mt-4 h-48 w-full">
              <BarChart data={reviews} layout="vertical" accessibilityLayer>
                <CartesianGrid
                  horizontal={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  width={136}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => String(label)}
                      formatter={(value, _name, item) => (
                        <span className="flex w-full items-center justify-between gap-4">
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {
                              reviewConfig[
                                item.dataKey as keyof typeof reviewConfig
                              ]?.label
                            }
                          </span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {numberFormat.format(Number(value))}
                          </span>
                        </span>
                      )}
                    />
                  }
                />
                <ChartLegend
                  content={
                    <ChartLegendContent className="flex-wrap gap-x-3 gap-y-1 text-xs" />
                  }
                />
                <Bar
                  dataKey="approved"
                  stackId="decisions"
                  fill="var(--color-approved)"
                />
                <Bar
                  dataKey="rejected"
                  stackId="decisions"
                  fill="var(--color-rejected)"
                />
                <Bar
                  dataKey="pending"
                  stackId="decisions"
                  fill="var(--color-pending)"
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No verification decisions in this period or requests pending now.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>
              {numberFormat.format(metrics.userVerifications.pending)}{" "}
              {metrics.userVerifications.pending === 1 ? "account" : "accounts"}{" "}
              awaiting review
            </span>
            <span>
              {numberFormat.format(metrics.apartmentVerifications.pending)}{" "}
              {metrics.apartmentVerifications.pending === 1
                ? "listing"
                : "listings"}{" "}
              awaiting review
            </span>
          </div>
          <Link
            href="/admin/verification"
            className="mt-3 inline-block rounded-sm text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Review queue <span aria-hidden="true">→</span>
          </Link>
        </Panel>

        <Panel
          title="Applications & Tenancies"
          description="Application and tenancy activity for the selected period. Active tenancies represent the current state."
        >
          <ChartContainer
            config={applicationConfig}
            className="mt-4 h-52 w-full"
          >
            <BarChart
              data={applicationActivity}
              layout="vertical"
              accessibilityLayer
              margin={{ top: 4, right: 28, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                domain={[0, (max: number) => Math.max(1, max + 1)]}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={160}
                tick={({ x, y, payload }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={-8}
                      y={-4}
                      textAnchor="end"
                      className="fill-foreground"
                      fontSize={11}
                    >
                      {payload.value}
                    </text>
                    <text
                      x={-8}
                      y={10}
                      textAnchor="end"
                      className="fill-muted-foreground"
                      fontSize={10}
                    >
                      {payload.value === "Active tenancies"
                        ? "Current"
                        : "Period"}
                    </text>
                  </g>
                )}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      String(payload[0]?.payload?.name ?? "")
                    }
                    formatter={(value, _name, item) => (
                      <span className="flex w-full justify-between gap-4 text-foreground">
                        <span className="text-muted-foreground">
                          {item.payload.scope}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {numberFormat.format(Number(value))}
                        </span>
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="value"
                name="Count"
                fill="var(--color-value)"
                maxBarSize={18}
                radius={[0, 4, 4, 0]}
              >
                <LabelList
                  dataKey="value"
                  position="right"
                  className="fill-foreground"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
          <p className="mt-3 text-xs text-muted-foreground">
            Approved applications were submitted in the period and are approved
            now. These counts are independent and should not be interpreted as a
            conversion funnel.
          </p>
        </Panel>

      </AnalyticsSection>

      <AnalyticsSection id="financial-operations-heading" title="Financial and Operations" icon={IconWallet} gridClassName="lg:grid-cols-2 xl:grid-cols-4">

        <Panel
          title="Rental Payments"
          description="Payments currently marked paid, by recorded payment date in the selected period (UTC)."
          className="xl:col-span-3"
        >
          {paymentTrends === null ? (
            <p
              className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
              role="status"
            >
              Rental payment data is unavailable. Refresh and try again.
            </p>
          ) : (
            <>
              <p className="mt-4 font-nunito text-3xl font-bold tabular-nums text-primary sm:text-4xl">
                {moneyFormat.format(paymentTotal)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {numberFormat.format(paymentCount)} successful{" "}
                {paymentCount === 1 ? "payment" : "payments"}
              </p>
              {paymentCount > 0 ? (
                <>
                  <ChartContainer
                    config={paymentConfig}
                    className="mt-4 h-52 w-full sm:h-56"
                  >
                    <LineChart
                      data={paymentTrends}
                      accessibilityLayer
                      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="bucket_start"
                        tickFormatter={shortDate}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={24}
                      />
                      <YAxis
                        tickFormatter={(value: number) =>
                          compactMoneyFormat.format(value)
                        }
                        tickLine={false}
                        axisLine={false}
                        width={72}
                      />
                      <ChartTooltip
                        cursor={{ stroke: "var(--border)" }}
                        content={
                          <ChartTooltipContent
                            labelFormatter={(_, payload) =>
                              bucketDateLabel(
                                payload[0]?.payload as PaymentTrend | undefined,
                              )
                            }
                            formatter={(value, _name, item) => (
                              <span className="flex w-full flex-col gap-1">
                                <span className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    Successful payment volume
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {moneyFormat.format(Number(value))}
                                  </span>
                                </span>
                                <span className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">
                                    Payments
                                  </span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {numberFormat.format(
                                      (item.payload as PaymentTrend)
                                        .payment_count,
                                    )}
                                  </span>
                                </span>
                              </span>
                            )}
                          />
                        }
                      />
                      <Line
                        dataKey="payment_total"
                        type="linear"
                        stroke="var(--color-payment_total)"
                        strokeWidth={2}
                        dot={paymentTrends.length === 1}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ChartContainer>
                  <p className="sr-only">
                    {paymentTrends
                      .map(
                        (bucket) =>
                          `${bucketDateLabel(bucket)}: ${moneyFormat.format(bucket.payment_total)} across ${bucket.payment_count} successful payments.`,
                      )
                      .join(" ")}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Average payment amount{" "}
                    <span className="font-nunito font-bold tabular-nums text-foreground">
                      {moneyFormat.format(paymentTotal / paymentCount)}
                    </span>
                  </p>
                </>
              ) : (
                <p
                  className="mt-4 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
                  role="status"
                >
                  No successful payments recorded in this period.
                </p>
              )}
            </>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Recorded rental payment volume, not APT platform revenue.
          </p>
        </Panel>

        <Panel
          title="Maintenance Requests"
          description="Requests created within the selected reporting period, grouped by current status."
        >
          {metrics.maintenance.total ? (
            <StatusDonut
              data={maintenance}
              config={maintenanceConfig}
              total={metrics.maintenance.total}
              centerLabel="Requests"
              className="lg:flex-col"
              chartClassName="xl:size-40 2xl:size-52"
            />
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground" role="status">
              No maintenance requests were created in this period.
            </p>
          )}
        </Panel>

      </AnalyticsSection>

      <AnalyticsSection id="marketplace-heading" title="Marketplace / Inventory" icon={IconBuilding}>

        <Panel
          title="Listing Status"
          description="Current inventory · non-deleted listings, regardless of the selected reporting period."
        >
          {listingStatus === null ? (
            <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground" role="status">
              Listing inventory is unavailable. Refresh and try again.
            </p>
          ) : listingStatus.total ? (
            <>
              <StatusDonut
                data={listingSlices}
                config={listingConfig}
                total={listingStatus.total}
                centerLabel="Listings"
                showPercent
                className="lg:flex-col 2xl:flex-row"
                chartClassName="lg:size-40 2xl:size-52"
              />
              <p className="mt-4 text-xs text-muted-foreground">
                Each listing is counted once: hidden first, then pending verification, then occupied or available.
                {listingStatus.other ? " Other covers remaining availability statuses, such as under maintenance or unverified." : ""}
              </p>
            </>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground" role="status">
              No listings in the current inventory.
            </p>
          )}
        </Panel>

        <Panel
          title="Listings by City"
          description="Current listing distribution across CAMANAVA."
        >
          {listingsByCity === null ? (
            <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground" role="status">
              City distribution is unavailable. Refresh and try again.
            </p>
          ) : cityBars.some((row) => row.value > 0) ? (
            <>
              <ChartContainer config={cityConfig} className="mt-4 h-56 w-full">
                <BarChart data={cityBars} layout="vertical" accessibilityLayer margin={{ top: 4, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} domain={[0, (max: number) => Math.max(1, max + 1)]} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={86} tick={{ fontSize: 11 }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) => String(payload[0]?.payload?.name ?? "")}
                        formatter={(value) => (
                          <span className="flex w-full justify-between gap-4">
                            <span className="text-muted-foreground">Listings</span>
                            <span className="font-mono font-medium tabular-nums text-foreground">{numberFormat.format(Number(value))}</span>
                          </span>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="value" name="Listings" fill="var(--color-value)" maxBarSize={24} radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={11} />
                  </Bar>
                </BarChart>
              </ChartContainer>
              <p className="sr-only">
                {cityBars.map((row) => `${row.name}: ${row.value} listings.`).join(" ")}
              </p>
            </>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground" role="status">
              No listings recorded in the four CAMANAVA cities.
            </p>
          )}
          {listingsByCity !== null && unmatchedCityCount > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {numberFormat.format(unmatchedCityCount)} {unmatchedCityCount === 1 ? "listing has" : "listings have"} a city outside these four labels and {unmatchedCityCount === 1 ? "is" : "are"} not shown.
            </p>
          ) : null}
        </Panel>

      </AnalyticsSection>

      <AnalyticsSection id="applications-heading" title="Applications" icon={IconFileText}>

        <Panel
          title="Application Status"
          description="Current status of all rental applications · not limited to the selected reporting period."
        >
          {applicationStatus === null ? (
            <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground" role="status">
              Application status is unavailable. Refresh and try again.
            </p>
          ) : applicationStatus.total ? (
            <StatusDonut
              data={applicationSlices}
              config={applicationStatusConfig}
              total={applicationStatus.total}
              centerLabel="Applications"
              showPercent
            />
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground" role="status">
              No rental applications yet.
            </p>
          )}
        </Panel>
      </AnalyticsSection>
    </div>
  );
}
