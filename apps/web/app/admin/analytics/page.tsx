import { IconChartBar } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";
import AnalyticsControls from "./AnalyticsControls";
import AnalyticsPanels from "./AnalyticsPanels";
import type {
  AnalyticsMetrics,
  ApplicationStatusCounts,
  ListingStatus,
  ListingCityCount,
  PaymentTrend,
  AnalyticsTrend,
} from "./types";

export const dynamic = "force-dynamic";
const MAX_REPORTING_DAYS = 36525;

function parseDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const today = new Date();
  const end = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const days = [7, 30, 90].includes(Number(params.days))
    ? Number(params.days)
    : 30;
  const defaultStart = new Date(end);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - days + 1);
  const custom = params.from !== undefined || params.to !== undefined;
  const allTime = !custom && params.days === "all";
  const supabase = await createClient();
  let start = custom ? parseDate(params.from) : defaultStart;
  const finish = custom ? parseDate(params.to) : end;
  let startError: string | null = null;
  if (allTime) {
    const { data, error } = await supabase.rpc("get_admin_analytics_start_date");
    if (error) {
      console.error("Admin analytics start date failed", error);
      startError = "Unable to load the full reporting history. Refresh and try again.";
      start = null;
    } else {
      start = parseDate(data);
    }
  }
  const valid =
    start !== null &&
    finish !== null &&
    finish.getTime() >= start.getTime() &&
    finish.getTime() <= end.getTime() &&
    finish.getTime() - start.getTime() <= MAX_REPORTING_DAYS * 86400000;

  let metrics: AnalyticsMetrics | null = null;
  let trends: AnalyticsTrend[] | null = null;
  let paymentTrends: PaymentTrend[] | null = null;
  let listingStatus: ListingStatus | null = null;
  let listingsByCity: ListingCityCount[] | null = null;
  let applicationStatus: ApplicationStatusCounts | null = null;
  let error = startError ?? (valid ? null : "Select a valid reporting range of up to 100 years.");
  if (!error && valid && start && finish) {
    const from = start.toISOString().slice(0, 10);
    const to = finish.toISOString().slice(0, 10);
    const [summary, growth, payments, inventory, cities, applications] =
      await Promise.all([
        supabase.rpc("get_admin_analytics", { date_from: from, date_to: to }),
        supabase.rpc("get_admin_analytics_trends", { p_from: from, p_to: to }),
        supabase.rpc("get_admin_rental_payment_trends", {
          p_from: from,
          p_to: to,
        }),
        supabase.rpc("get_admin_listing_status"),
        supabase.rpc("get_admin_listings_by_city"),
        supabase.rpc("get_admin_application_status"),
      ]);
    if (summary.error) {
      console.error("Admin analytics failed", summary.error);
      error = "Unable to load analytics. Refresh and try again.";
    } else {
      metrics = summary.data as unknown as AnalyticsMetrics;
    }
    if (growth.error) {
      console.error("Admin analytics growth failed", growth.error);
    } else {
      trends = growth.data as AnalyticsTrend[];
    }
    if (payments.error) {
      console.error("Admin rental payment trends failed", payments.error);
    } else {
      paymentTrends = payments.data;
    }
    if (inventory.error) {
      console.error("Admin listing status failed", inventory.error);
    } else {
      listingStatus = inventory.data[0] ?? null;
    }
    if (cities.error) {
      console.error("Admin listings by city failed", cities.error);
    } else {
      listingsByCity = cities.data;
    }
    if (applications.error) {
      console.error("Admin application status failed", applications.error);
    } else {
      applicationStatus = applications.data[0] ?? null;
    }
  }
  const endDate = end.toISOString().slice(0, 10);
  const controlFrom = (valid && start ? start : defaultStart)
    .toISOString()
    .slice(0, 10);
  const controlTo = (valid && finish ? finish : end).toISOString().slice(0, 10);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4">
      <header className="space-y-4">
        <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconChartBar
              size={28}
              className="text-primary"
              aria-hidden="true"
            />
          </span>
          Analytics
        </h1>

        <p className="text-sm text-muted-foreground">
          Selected-period activity uses UTC dates. Current-state totals are
          marked separately and do not change with the reporting range.
        </p>

        <AnalyticsControls
          from={controlFrom}
          to={controlTo}
          today={endDate}
          selectedPeriod={custom ? null : allTime ? "all" : days}
        />
      </header>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : metrics && valid && start && finish ? (
        <AnalyticsPanels
          metrics={metrics}
          trends={trends}
          paymentTrends={paymentTrends}
          listingStatus={listingStatus}
          listingsByCity={listingsByCity}
          applicationStatus={applicationStatus}
          from={start.toISOString().slice(0, 10)}
          to={finish.toISOString().slice(0, 10)}
        />
      ) : null}
    </div>
  );
}
