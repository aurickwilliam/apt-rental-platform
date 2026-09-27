import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Clock3,
  History,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireAdmin } from "../_lib/require-admin";
import DashboardTrends from "./components/DashboardTrends";
import CurrentMonthCalendar from "./components/CurrentMonthCalendar";
import PlatformTotalCard from "./components/PlatformTotalCard";
import RecentApartmentCard from "./components/RecentApartmentCard";
import RecentUserCard from "./components/RecentUserCard";
import VerificationQueue from "./components/VerificationQueue";
import { QueueChart } from "./components/DashboardCharts";
import { getDashboardData, type RecentItem } from "./lib/get-dashboard-data";

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
}: {
  title: string;
  href: string;
  items: RecentItem[];
  kind: "users" | "apartments" | "activity";
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
                    <History size={19} aria-hidden="true" />
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
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-primary"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </li>
          ))
        ) : (
          <li className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nothing to show yet.
          </li>
        )}
      </ul>
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
  const data = await getDashboardData(from, to);
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
  const stats: {
    label: string;
    value: number | null;
    href: string;
    icon: LucideIcon;
    primary?: boolean;
  }[] = [
    {
      label: "Total users",
      value: data.totals.users,
      href: "/admin/users",
      icon: Users,
      primary: true,
    },
    {
      label: "Total apartments",
      value: data.totals.apartments,
      href: "/admin/apartments",
      icon: Building2,
    },
    {
      label: "Pending user reviews",
      value: data.totals.pendingUsers,
      href: "/admin/verification?tab=users",
      icon: ShieldCheck,
    },
    {
      label: "Pending apartment reviews",
      value: data.totals.pendingApartments,
      href: "/admin/verification?tab=apartments",
      icon: Clock3,
    },
  ];

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

      {data.hasError || data.chartsError ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          Some dashboard data could not be loaded. Refresh and try again.
        </p>
      ) : null}

      <section
        aria-label="Current platform totals"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, href, icon, primary }) => (
          <PlatformTotalCard
            key={label}
            label={label}
            value={value}
            href={href}
            icon={icon}
            primary={primary}
          />
        ))}
      </section>

      <div className="grid min-w-0 items-stretch gap-4 xl:grid-cols-4">
        <div className="min-w-0 self-stretch xl:col-span-3">
          <VerificationQueue requests={data.queue} />
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
            <QueueChart
              users={data.totals.pendingUsers}
              apartments={data.totals.pendingApartments}
            />
          </section>
        </div>
      </div>

      <DashboardTrends
        from={from}
        to={to}
        today={today}
        initialTrends={data.trends}
      />

      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="mb-3 font-nunito text-xl font-bold">
          Recently added
        </h2>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <RecentSection
            title="Recent users"
            href="/admin/users"
            items={data.recentUsers}
            kind="users"
          />
          <RecentSection
            title="Recent apartments"
            href="/admin/apartments"
            items={data.recentApartments}
            kind="apartments"
          />
          <RecentSection
            title="Recent activity"
            href="/admin/activity"
            items={data.recentActivity}
            kind="activity"
          />
        </div>
      </section>
    </div>
  );
}
