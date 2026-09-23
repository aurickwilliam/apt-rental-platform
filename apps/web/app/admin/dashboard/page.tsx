import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [users, apartments, pendingUsers, pendingApartments] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("apartments").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("user_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("apartment_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const stats = [["Users", users.count ?? 0, "/admin/users"], ["Apartments", apartments.count ?? 0, "/admin/apartments"], ["Pending user reviews", pendingUsers.count ?? 0, "/admin/verification?tab=users"], ["Pending apartment reviews", pendingApartments.count ?? 0, "/admin/verification?tab=apartments"]];
  return <div className="mx-auto w-full max-w-7xl space-y-6 p-4"><div><h1 className="font-nunito text-3xl font-bold text-foreground">Admin dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Review account and property verification requests.</p></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value, href]) => <Link key={label} href={href as string} className="rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 font-nunito text-2xl font-bold">{value}</p></Link>)}</div><section className="rounded-xl border border-border bg-card p-4"><h2 className="font-nunito text-lg font-bold">Review queue</h2><p className="mt-1 text-sm text-muted-foreground">Open Verification to approve or reject pending submissions. All actions are recorded in Activity.</p><Link className="mt-4 inline-block text-sm font-semibold text-primary underline-offset-4 hover:underline" href="/admin/verification">Open verification queue</Link></section></div>;
}
