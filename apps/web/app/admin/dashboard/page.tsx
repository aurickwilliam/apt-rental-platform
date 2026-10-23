import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconBuilding,
  IconChevronRight,
  IconClockHour3,
  IconHistory,
  IconShieldCheck,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";
import { requireAdmin } from "../_lib/require-admin";
import DashboardTrends from "./components/DashboardTrends";
import CurrentMonthCalendar from "./components/CurrentMonthCalendar";
import PlatformTotalCard from "./components/PlatformTotalCard";
import RecentApartmentCard from "./components/RecentApartmentCard";
import RecentUserCard from "./components/RecentUserCard";
import VerificationQueue from "./components/VerificationQueue";
import { QueueChart } from "./components/DashboardCharts";
import { getDashboardRegions, getDashboardTrends, type DashboardData, type DashboardRegion, type RecentItem, type VerificationRequest } from "./lib/get-dashboard-data";

export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;

function validDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
    ? parsed
    : null;
}

function RecentSection({
  title,
  href,
  items,
  kind,
  hasError = false,
}: {
  title: string;
  href: string;
  items: RecentItem[];
  kind: "users" | "apartments" | "activity";
  hasError?: boolean;
}) {
  return (
    <section className="min-w-0 rounded-3xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-nunito text-lg font-bold">{title}</h2>
        <Link
          href={href}
          className="shrink-0 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View all
        </Link>
      </div>
      {hasError ? <DashboardError /> : null}
      <ul className="mt-4 space-y-2">
        {items.length ? (
          items.map((item) => (
            <li key={item.id}>
              {kind === "users" ? (
                <RecentUserCard user={item} />
              ) : kind === "apartments" ? (
                <RecentApartmentCard apartment={item} />
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-3xl bg-muted/50 p-3 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <IconHistory size={19} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-nunito text-sm font-bold capitalize">
                      {item.name}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">{item.detail}</span>
                      <span aria-hidden="true" className="shrink-0">
                        ·
                      </span>
                      <time dateTime={item.date} className="shrink-0">
                        {new Intl.DateTimeFormat("en-PH", {
                          dateStyle: "medium",
                          timeZone: "Asia/Manila",
                        }).format(new Date(item.date))}
                      </time>
                    </span>
                  </span>
                  <IconChevronRight
                    size={16}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </li>
          ))
        ) : !hasError ? (
          <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing to show yet.
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function DashboardError() {
  return <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">Some dashboard data could not be loaded. Refresh and try again.</p>;
}

function RegionPlaceholder({ label, totals = false }: { label: string; totals?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={totals ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-4" : "min-w-0 rounded-3xl border border-border bg-card p-4 sm:p-5"}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: totals ? 4 : 3 }, (_, index) => <Skeleton key={index} className={totals ? "h-28 rounded-3xl bg-muted" : "mb-3 h-16 rounded-xl bg-muted"} />)}
    </div>
  );
}

async function QueueSection({ pending }: { pending: Promise<DashboardRegion<VerificationRequest[]>> }) {
  const result = await pending;
  return <>{result.hasError ? <DashboardError /> : null}<VerificationQueue requests={result.data} /></>;
}

async function QueueTotals({ pending }: { pending: Promise<DashboardRegion<DashboardData["totals"]>> }) {
  const result = await pending;
  return <>{result.hasError ? <DashboardError /> : null}<QueueChart users={result.data.pendingUsers} apartments={result.data.pendingApartments} /></>;
}

async function RecentRegion({ pending, ...props }: {
  pending: Promise<DashboardRegion<RecentItem[]>>;
  title: string;
  href: string;
  kind: "users" | "apartments" | "activity";
}) {
  const result = await pending;
  return <RecentSection {...props} items={result.data} hasError={result.hasError} />;
}

async function TotalsSection({ pending }: { pending: Promise<DashboardRegion<DashboardData["totals"]>> }) {
  const result = await pending;
  const stats: { label: string; value: number | null; href: string; icon: Icon; primary?: boolean }[] = [
    { label: "Total users", value: result.data.users, href: "/admin/users", icon: IconUsers, primary: true },
    { label: "Total apartments", value: result.data.apartments, href: "/admin/apartments", icon: IconBuilding },
    { label: "Pending user reviews", value: result.data.pendingUsers, href: "/admin/verification?tab=users", icon: IconShieldCheck },
    { label: "Pending apartment reviews", value: result.data.pendingApartments, href: "/admin/verification?tab=apartments", icon: IconClockHour3 },
  ];
  return (
    <div>
      {result.hasError ? <DashboardError /> : null}
      <section aria-label="Current platform totals" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, href, icon, primary }) => <PlatformTotalCard key={label} label={label} value={value} href={href} icon={icon} primary={primary} />)}
      </section>
    </div>
  );
}

async function TrendsSection({ from, to, today, trendsPromise }: {
  from: string;
  to: string;
  today: string;
  trendsPromise: ReturnType<typeof getDashboardTrends>;
}) {
  const { trends, error } = await trendsPromise;
  return (
    <>
      {error ? (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          Some dashboard data could not be loaded. Refresh and try again.
        </p>
      ) : null}
      <DashboardTrends from={from} to={to} today={today} initialTrends={trends} />
    </>
  );
}

function TrendsSkeleton() {
  return (
    <section aria-label="Loading platform trends" className="space-y-3">
      <Skeleton className="h-6 w-44 bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-64 rounded-3xl border border-border bg-muted" />
        ))}
      </div>
    </section>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const profile = await requireAdmin();
  const params = await searchParams;
  // Use Philippine calendar dates for both the greeting and the chart boundaries.
  const now = new Date();
  const today = new Date(now.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const todayDate = validDate(today)!;
  const defaultFrom = new Date(todayDate.getTime() - 29 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  const fromDate = validDate(params.from);
  const toDate = validDate(params.to);
  const custom = params.from !== undefined || params.to !== undefined;
  const validRange =
    custom &&
    fromDate &&
    toDate &&
    fromDate <= toDate &&
    toDate <= todayDate &&
    fromDate >= new Date(todayDate.getTime() - 89 * DAY_MS);
  const from = validRange ? params.from! : defaultFrom;
  const to = validRange ? params.to! : today;
  const trendsPromise = getDashboardTrends(from, to);
  const regions = await getDashboardRegions();
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "Asia/Manila",
    }).format(now),
  );
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = profile.first_name?.trim() || "Administrator";

  return (
    <div className="w-full min-w-0 space-y-6 p-4 font-inter sm:p-6 xl:p-8">
      <header>
        <div>
          <p className="font-nunito text-sm font-bold text-primary">
            ADMIN OVERVIEW
          </p>
          <h1 className="mt-1 font-nunito text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {greeting}, {name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what needs your attention today.
          </p>
        </div>
      </header>

      <Suspense fallback={<RegionPlaceholder label="Loading platform totals" totals />}>
        <TotalsSection pending={regions.totals} />
      </Suspense>

      <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-4">
        <div className="min-w-0 self-stretch xl:col-span-3">
          <Suspense fallback={<RegionPlaceholder label="Loading verification requests" />}>
            <QueueSection pending={regions.queue} />
          </Suspense>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <CurrentMonthCalendar today={today} />
          <section
            className="min-w-0 rounded-3xl border border-border bg-card p-4 sm:p-5"
            aria-labelledby="queue-heading"
          >
            <h2 id="queue-heading" className="font-nunito text-lg font-bold">
              Verification queue
            </h2>
            <p className="text-sm text-muted-foreground">
              Pending right now · all submissions
            </p>
            <Suspense fallback={<RegionPlaceholder label="Loading queue totals" />}>
              <QueueTotals pending={regions.totals} />
            </Suspense>
          </section>
        </div>
      </div>

      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsSection from={from} to={to} today={today} trendsPromise={trendsPromise} />
      </Suspense>

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 font-nunito text-xl font-bold">
          Recently added
        </h2>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <Suspense fallback={<RegionPlaceholder label="Loading recent users" />}>
          <RecentRegion
            title="Recent users"
            href="/admin/users"
            pending={regions.recentUsers}
            kind="users"
          />
          </Suspense>
          <Suspense fallback={<RegionPlaceholder label="Loading recent apartments" />}>
          <RecentRegion
            title="Recent apartments"
            href="/admin/apartments"
            pending={regions.recentApartments}
            kind="apartments"
          />
          </Suspense>
          <Suspense fallback={<RegionPlaceholder label="Loading recent activity" />}>
          <RecentRegion
            title="Recent activity"
            href="/admin/activity"
            pending={regions.recentActivity}
            kind="activity"
          />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
