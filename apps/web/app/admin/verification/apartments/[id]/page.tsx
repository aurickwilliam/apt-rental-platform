import { notFound } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { Chip } from "@heroui/react";
import { requireAdmin } from "../../../_lib/require-admin";
import { reviewApartmentVerification } from "../../../actions/verification";
import { ReviewForm } from "../../ReviewForm";

interface PageProps { params: Promise<{ id: string }> }
export default async function ApartmentVerificationReviewPage({ params }: PageProps) {
  await requireAdmin(); const { id } = await params; const supabase = await createClient();
  const { data: verification } = await supabase.from("apartment_verifications").select("id, apartment_id, landlord_id, status, submitted_at, rejection_reason").eq("id", id).single();
  if (!verification) notFound();
  const [{ data: apartment }, { data: landlord }] = await Promise.all([supabase.from("apartments").select("name, street_address, barangay, city, province, monthly_rent, is_verified, lease_agreement_url").eq("id", verification.apartment_id).single(), supabase.from("users").select("first_name, last_name, email").eq("id", verification.landlord_id).single()]);
  return <div className="mx-auto w-full max-w-5xl space-y-5 p-4"><div><Chip variant="soft" color="warning">{verification.status}</Chip><h1 className="mt-3 font-nunito text-3xl font-bold">Apartment verification</h1><p className="mt-1 text-sm text-muted-foreground">Submitted {new Date(verification.submitted_at).toLocaleString()}</p></div><section className="rounded-xl border border-border p-4"><h2 className="font-nunito text-lg font-bold">Property</h2><dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-muted-foreground">Name</dt><dd>{apartment?.name ?? "Unavailable"}</dd></div><div><dt className="text-muted-foreground">Address</dt><dd>{[apartment?.street_address, apartment?.barangay, apartment?.city].filter(Boolean).join(", ") || "Unavailable"}</dd></div><div><dt className="text-muted-foreground">Landlord</dt><dd>{`${landlord?.first_name ?? ""} ${landlord?.last_name ?? ""}`.trim() || landlord?.email || "Unavailable"}</dd></div></dl></section>{verification.status === "pending" ? <section className="rounded-xl border border-border p-4"><h2 className="font-nunito text-lg font-bold">Decision</h2><p className="mb-3 text-sm text-muted-foreground">Approval sets this apartment as verified. Rejections must include a reason.</p><ReviewForm verificationId={verification.id} onReview={reviewApartmentVerification} /></section> : null}</div>;
}
