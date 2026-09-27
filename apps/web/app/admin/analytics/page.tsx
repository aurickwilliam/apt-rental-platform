import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";

interface Metrics {
  users: { total: number; new: number; newTenants: number; newLandlords: number; tenants: number; landlords: number; verified: number; suspended: number };
  apartments: { total: number; new: number; hidden: number; verified: number; available: number };
  userVerifications: { pending: number; approved: number; rejected: number };
  apartmentVerifications: { pending: number; approved: number; rejected: number };
  applications: { new: number; approved: number };
  tenancies: { new: number; active: number; occupiedUnits: number };
  payments: { paidCount: number; paidTotal: number };
  maintenance: { total: number; pending: number; inProgress: number; resolved: number; cancelled: number };
}

function parseDate(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export default async function AdminAnalyticsPage({ searchParams }: {
  searchParams: Promise<{ days?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const days = [7, 30, 90].includes(Number(params.days)) ? Number(params.days) : 30;
  const defaultStart = new Date(end);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - days + 1);
  const custom = params.from !== undefined || params.to !== undefined;
  const start = custom ? parseDate(params.from) : defaultStart;
  const finish = custom ? parseDate(params.to) : end;
  const valid = start !== null && finish !== null && finish.getTime() >= start.getTime()
    && finish.getTime() <= end.getTime() && finish.getTime() - start.getTime() <= 365 * 86400000;

  let metrics: Metrics | null = null;
  let error = valid ? null : "Select valid dates within the past year (up to 366 days).";
  if (valid && start && finish) {
    const supabase = await createClient();
    const { data, error: queryError } = await supabase.rpc("get_admin_analytics", {
      date_from: start.toISOString().slice(0, 10), date_to: finish.toISOString().slice(0, 10),
    });
    if (queryError) {
      console.error("Admin analytics failed", queryError);
      error = "Unable to load analytics. Refresh and try again.";
    } else {
      metrics = data as unknown as Metrics;
    }
  }

  const rows: { title: string; values: [string, number | string][] }[] = metrics ? [
    { title: "Accounts", values: [["Total users", metrics.users.total], ["New users", metrics.users.new], ["New tenants", metrics.users.newTenants], ["New landlords", metrics.users.newLandlords], ["Tenants now", metrics.users.tenants], ["Landlords now", metrics.users.landlords], ["Verified now", metrics.users.verified], ["Suspended now", metrics.users.suspended]] },
    { title: "Listings", values: [["Total", metrics.apartments.total], ["New", metrics.apartments.new], ["Available", metrics.apartments.available], ["Verified", metrics.apartments.verified], ["Hidden", metrics.apartments.hidden]] },
    { title: "Account verification", values: [["Pending now", metrics.userVerifications.pending], ["Approved in range", metrics.userVerifications.approved], ["Rejected in range", metrics.userVerifications.rejected]] },
    { title: "Listing verification", values: [["Pending now", metrics.apartmentVerifications.pending], ["Approved in range", metrics.apartmentVerifications.approved], ["Rejected in range", metrics.apartmentVerifications.rejected]] },
    { title: "Applications", values: [["Submitted", metrics.applications.new], ["Approved", metrics.applications.approved]] },
    { title: "Tenancies", values: [["New", metrics.tenancies.new], ["Active now", metrics.tenancies.active], ["Occupied units now", metrics.tenancies.occupiedUnits]] },
    { title: "Payments", values: [["Paid count", metrics.payments.paidCount], ["Paid amount (PHP)", new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(metrics.payments.paidTotal)]] },
    { title: "Maintenance", values: [["New requests", metrics.maintenance.total], ["Pending", metrics.maintenance.pending], ["In progress", metrics.maintenance.inProgress], ["Resolved", metrics.maintenance.resolved], ["Cancelled", metrics.maintenance.cancelled]] },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <h1 className="font-nunito text-3xl font-bold">Analytics</h1>
      <p className="text-sm text-muted-foreground">Counts marked “now” are current totals; other activity is measured within the selected dates (UTC).</p>
      <nav aria-label="Date presets" className="flex gap-4 text-sm font-semibold text-primary">
        {[7, 30, 90].map((period) => <Link key={period} href={`/admin/analytics?days=${period}`} className="hover:underline">Last {period} days</Link>)}
      </nav>
      <form className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">From <input type="date" name="from" required defaultValue={start?.toISOString().slice(0, 10)} max={end.toISOString().slice(0, 10)} className="h-10 rounded-xl border border-border bg-card px-3 focus:ring-2 focus:ring-primary/15" /></label>
        <label className="flex flex-col gap-1 text-sm">To <input type="date" name="to" required defaultValue={finish?.toISOString().slice(0, 10)} max={end.toISOString().slice(0, 10)} className="h-10 rounded-xl border border-border bg-card px-3 focus:ring-2 focus:ring-primary/15" /></label>
        <button className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-white">Apply dates</button>
      </form>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((group) => <section key={group.title} className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-nunito text-lg font-bold">{group.title}</h2>
            <dl className="mt-3 space-y-2">{group.values.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>
          </section>)}
        </div>
      )}
    </div>
  );
}
