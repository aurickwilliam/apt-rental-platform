import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [
    users,
    apartments,
    pendingUsers,
    pendingApartments,
    recentUsers,
    recentApartments,
    recentActivity,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("user_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("apartment_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("apartments")
      .select("id, name, city")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("admin_audit_logs")
      .select("id, action, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  const hasError = [
    users,
    apartments,
    pendingUsers,
    pendingApartments,
    recentUsers,
    recentApartments,
    recentActivity,
  ].some((result) => Boolean(result.error));
  const stats = [
    ["Users", users.count ?? 0, "/admin/users"],
    ["Apartments", apartments.count ?? 0, "/admin/apartments"],
    [
      "Pending user reviews",
      pendingUsers.count ?? 0,
      "/admin/verification?tab=users",
    ],
    [
      "Pending apartment reviews",
      pendingApartments.count ?? 0,
      "/admin/verification?tab=apartments",
    ],
  ] as const;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4">
      <div>
        <h1 className="font-nunito text-3xl font-bold text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review account and property verification requests.
        </p>
      </div>
      {hasError ? (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
        >
          Some dashboard data could not be loaded. Refresh and try again.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, href]) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 font-nunito text-2xl font-bold tabular-nums">
              {value}
            </p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentList
          title="Recent users"
          href="/admin/users"
          items={(recentUsers.data ?? []).map((user) => ({
            href: `/admin/users/${user.id}`,
            label:
              `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
              user.email ||
              "Unnamed user",
            detail: user.email ?? "",
          }))}
        />
        <RecentList
          title="Recent apartments"
          href="/admin/apartments"
          items={(recentApartments.data ?? []).map((apartment) => ({
            href: `/admin/apartments/${apartment.id}`,
            label: apartment.name,
            detail: apartment.city ?? "",
          }))}
        />
        <RecentList
          title="Recent activity"
          href="/admin/activity"
          items={(recentActivity.data ?? []).map((event) => ({
            href: "/admin/activity",
            label: event.action.replaceAll("_", " "),
            detail: new Intl.DateTimeFormat("en-PH", {
              dateStyle: "medium",
            }).format(new Date(event.created_at)),
          }))}
        />
      </div>
    </div>
  );
}

function RecentList({
  title,
  href,
  items,
}: {
  title: string;
  href: string;
  items: { href: string; label: string; detail: string }[];
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-nunito text-lg font-bold">{title}</h2>
        <Link
          href={href}
          className="text-sm font-semibold text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {items.length ? (
          items.map((item) => (
            <li key={`${item.href}-${item.label}`} className="py-2 first:pt-0">
              <Link
                href={item.href}
                className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.detail}
                </p>
              </Link>
            </li>
          ))
        ) : (
          <li className="py-3 text-sm text-muted-foreground">
            Nothing to show yet.
          </li>
        )}
      </ul>
    </section>
  );
}
