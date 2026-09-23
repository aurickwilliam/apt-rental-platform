import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";
interface PageProps { searchParams: Promise<{ q?: string; role?: string }> }
export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin(); const { q = "", role = "" } = await searchParams; const supabase = await createClient();
  let query = supabase.from("users").select("id, first_name, last_name, email, role, account_status, created_at").order("created_at", { ascending: false }).limit(50);
  if (role === "tenant" || role === "landlord") query = query.eq("role", role);
  if (q.trim()) query = query.or(`first_name.ilike.%${q.trim()}%,last_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`);
  const { data: users, error } = await query;
  return <div className="mx-auto w-full max-w-7xl space-y-5 p-4"><div><h1 className="font-nunito text-3xl font-bold">Users</h1><p className="mt-1 text-sm text-muted-foreground">Search tenant and landlord accounts.</p></div><form className="flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Search name or email" className="h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"/><select name="role" defaultValue={role} className="h-10 rounded-xl border border-border bg-card px-3 text-sm"><option value="">All roles</option><option value="tenant">Tenant</option><option value="landlord">Landlord</option></select><button className="rounded-xl bg-primary px-4 text-sm font-semibold text-white">Apply</button></form>{error ? <p role="alert" className="text-sm text-danger">Unable to load users.</p> : <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Verification</th><th className="p-3"><span className="sr-only">Details</span></th></tr></thead><tbody>{users?.map((user) => <tr key={user.id} className="border-t border-border"><td className="p-3"><p className="font-medium">{`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unnamed user"}</p><p className="text-muted-foreground">{user.email}</p></td><td className="p-3 capitalize">{user.role}</td><td className="p-3 capitalize">{user.account_status}</td><td className="p-3 text-right"><Link href={`/admin/users/${user.id}`} className="font-semibold text-primary hover:underline">View</Link></td></tr>)}</tbody></table></div>}</div>;
}
