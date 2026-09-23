import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { Chip } from "@heroui/react";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";
interface PageProps { searchParams: Promise<{ tab?: string }> }
export default async function VerificationPage({ searchParams }: PageProps) {
  await requireAdmin(); const { tab } = await searchParams; const selected = tab === "apartments" ? "apartments" : "users"; const supabase = await createClient();
  const [userQueue, apartmentQueue] = await Promise.all([
    supabase.from("user_verifications").select("id, user_id, id_type, submitted_at, status").eq("status", "pending").order("submitted_at", { ascending: true }).limit(50),
    supabase.from("apartment_verifications").select("id, apartment_id, landlord_id, submitted_at, status").eq("status", "pending").order("submitted_at", { ascending: true }).limit(50),
  ]);
  const rows = selected === "users" ? userQueue.data ?? [] : apartmentQueue.data ?? [];
  return <div className="mx-auto w-full max-w-7xl space-y-5 p-4"><div><h1 className="font-nunito text-3xl font-bold">Verification</h1><p className="mt-1 text-sm text-muted-foreground">Pending submissions are shown oldest first.</p></div><nav className="flex gap-2" aria-label="Verification queues"><Link className={`rounded-full px-4 py-2 text-sm font-semibold ${selected === "users" ? "bg-primary text-white" : "bg-muted text-foreground"}`} href="/admin/verification?tab=users">Users ({userQueue.data?.length ?? 0})</Link><Link className={`rounded-full px-4 py-2 text-sm font-semibold ${selected === "apartments" ? "bg-primary text-white" : "bg-muted text-foreground"}`} href="/admin/verification?tab=apartments">Apartments ({apartmentQueue.data?.length ?? 0})</Link></nav><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground"><tr><th className="p-3">Submission</th><th className="p-3">Submitted</th><th className="p-3">Status</th><th className="p-3"><span className="sr-only">Review</span></th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.id} className="border-t border-border"><td className="p-3 font-medium">{selected === "users" ? "Account verification" : "Apartment verification"}</td><td className="p-3 text-muted-foreground">{new Date(row.submitted_at).toLocaleDateString()}</td><td className="p-3"><Chip variant="soft" color="warning">Pending</Chip></td><td className="p-3 text-right"><Link className="font-semibold text-primary underline-offset-4 hover:underline" href={`/admin/verification/${selected}/${row.id}`}>Review</Link></td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No pending {selected} verification requests.</td></tr>}</tbody></table></div></div>;
}
