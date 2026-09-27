import Link from "next/link";
import Image from "next/image";
import { Avatar } from "@heroui/react";
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
import DateRangeControl from "./components/DateRangeControl";
import VerificationQueue from "./components/VerificationQueue";
import { QueueChart, TrendChart } from "./components/DashboardCharts";
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
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
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
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {kind === "users" ? (
                  <Avatar
                    size="sm"
                    className="shrink-0 bg-primary/10 text-primary"
                  >
                    {item.image ? (
                      <Avatar.Image src={item.image} alt="" />
                    ) : null}
                    <Avatar.Fallback className="bg-primary/10 text-primary">
                      {item.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join("")}
                    </Avatar.Fallback>
                  </Avatar>
                ) : kind === "apartments" && item.image ? (
                  <Image
                    src={item.image}
                    alt=""
                    unoptimized
                    width={44}
                    height={44}
                    className="size-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {kind === "apartments" ? (
                      <Building2 size={19} aria-hidden="true" />
                    ) : (
                      <History size={19} aria-hidden="true" />
                    )}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-nunito text-sm font-bold capitalize">
                    {item.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.detail}
                  </span>
                  <time
                    dateTime={item.date}
                    className="block text-xs text-muted-foreground"
                  >
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeZone: "Asia/Manila",
                    }).format(new Date(item.date))}
                  </time>
                </span>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
              </Link>
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <DateRangeControl from={from} to={to} today={today} />
      </header>
      
      {custom && !validRange ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          Choose a valid reporting period within the last 90 days. Showing the
          last 30 days instead.
        </p>
      ) : null}
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
        {stats.map(({ label, value, href, icon: Icon, primary }) => (
          <Link
            key={label}
            href={href}
            className={`group flex min-h-36 flex-col justify-between rounded-xl border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${primary ? "border-primary bg-primary text-white hover:bg-primary/90" : "border-border bg-card hover:border-primary"}`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex size-9 items-center justify-center rounded-lg ${primary ? "bg-white/20" : "bg-primary/10 text-primary"}`}
              >
                <Icon size={18} aria-hidden="true" />
              </span>
              <span
                className={`font-nunito text-sm font-semibold ${primary ? "text-white" : "text-muted-foreground"}`}
              >
                {label}
              </span>
            </span>
            <span className="font-nunito text-3xl font-bold tabular-nums">
              {value === null ? "—" : value.toLocaleString("en-PH")}
            </span>
          </Link>
        ))}
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-4">
        <div className="min-w-0 xl:col-span-3">
          <VerificationQueue requests={data.queue} />
        </div>
        <section
          className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5"
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

      <section aria-labelledby="trends-heading">
        <div className="mb-3">
          <h2 id="trends-heading" className="font-nunito text-xl font-bold">
            Platform trends
          </h2>
          <p className="text-sm text-muted-foreground">
            Activity in the selected period · Philippine time
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <TrendChart
            data={data.trends}
            dataKey="users"
            title="New users"
            description="Accounts registered"
          />
          <TrendChart
            data={data.trends}
            dataKey="apartments"
            title="New apartments"
            description="Listings created"
            variant="bar"
          />
          <TrendChart
            data={data.trends}
            dataKey="reviews"
            title="Reviews completed"
            description="User and apartment decisions"
          />
        </div>
      </section>

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
