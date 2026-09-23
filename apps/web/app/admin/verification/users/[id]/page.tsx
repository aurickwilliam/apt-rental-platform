import { notFound } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { Chip } from "@heroui/react";
import { requireAdmin } from "../../../_lib/require-admin";
import { reviewUserVerification } from "../../../actions/verification";
import { ReviewForm } from "../../ReviewForm";

interface PageProps { params: Promise<{ id: string }> }
export default async function UserVerificationReviewPage({ params }: PageProps) {
  await requireAdmin(); const { id } = await params; const supabase = await createClient();
  const { data: verification } = await supabase.from("user_verifications").select("id, user_id, id_type, id_front_path, id_back_path, selfie_path, status, submitted_at, rejection_reason").eq("id", id).single();
  if (!verification) notFound();
  const { data: user } = await supabase.from("users").select("first_name, last_name, email, role, account_status").eq("id", verification.user_id).single();
  const paths = [verification.id_front_path, verification.id_back_path, verification.selfie_path].filter((path): path is string => Boolean(path));
  const urls = await Promise.all(paths.map(async (path) => (await supabase.storage.from("user-verification").createSignedUrl(path, 60 * 10)).data?.signedUrl ?? null));
  return <div className="mx-auto w-full max-w-5xl space-y-5 p-4"><div><Chip variant="soft" color="warning">{verification.status}</Chip><h1 className="mt-3 font-nunito text-3xl font-bold">Account verification</h1><p className="mt-1 text-sm text-muted-foreground">Submitted {new Date(verification.submitted_at).toLocaleString()}</p></div><section className="rounded-xl border border-border p-4"><h2 className="font-nunito text-lg font-bold">Applicant</h2><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Name</dt><dd>{`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Not provided"}</dd></div><div><dt className="text-muted-foreground">Email</dt><dd>{user?.email ?? "Not provided"}</dd></div><div><dt className="text-muted-foreground">Document type</dt><dd>{verification.id_type}</dd></div></dl></section><section className="rounded-xl border border-border p-4"><h2 className="font-nunito text-lg font-bold">Private documents</h2><div className="mt-3 grid gap-3 sm:grid-cols-3">{urls.map((url, index) => url ? <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded-xl border border-border p-3 text-sm font-semibold text-primary hover:bg-muted">Open {['ID front', 'ID back', 'Selfie'][index]}</a> : null)}</div></section>{verification.status === "pending" ? <section className="rounded-xl border border-border p-4"><h2 className="font-nunito text-lg font-bold">Decision</h2><p className="mb-3 text-sm text-muted-foreground">Approving verifies the account. Rejections must include a reason.</p><ReviewForm verificationId={verification.id} onReview={reviewUserVerification} /></section> : null}</div>;
}
