import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../_lib/require-admin";
import OperationForm from "../../OperationForm";
import { setApartmentVisibility } from "../../actions/operations";
interface PageProps {
  params: Promise<{ id: string }>;
}
export default async function AdminApartmentDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: apartment } = await supabase
    .from("apartments")
    .select(
      "id, name, description, street_address, barangay, city, province, status, is_verified, landlord_id, monthly_rent, is_hidden_by_admin, hidden_at, hidden_reason",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();
  if (!apartment) notFound();
  const [{ data: landlord }, { data: history }, { data: moderation }] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .eq("id", apartment.landlord_id!)
      .single(),
    supabase
      .from("apartment_verifications")
      .select("id, status, submitted_at, rejection_reason")
      .eq("apartment_id", id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabase.from("admin_audit_logs")
      .select("id, action, reason, created_at")
      .eq("target_type", "apartment")
      .eq("target_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4">
      <div>
        <h1 className="font-nunito text-3xl font-bold">{apartment.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {apartment.is_verified ? "Verified" : "Unverified"} ·{" "}
          {apartment.status} · {apartment.is_hidden_by_admin ? "Hidden by admin" : "Visible"}
        </p>
      </div>
      <section className="rounded-xl border border-border p-4">
        <h2 className="font-nunito text-lg font-bold">Listing</h2>
        <p className="mt-2 text-sm">{apartment.description}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {[
            apartment.street_address,
            apartment.barangay,
            apartment.city,
            apartment.province,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h2 className="font-nunito text-lg font-bold">Listing visibility</h2>
        <p className="mt-2 text-sm font-semibold">{apartment.is_hidden_by_admin ? "Hidden from discovery" : "Visible in discovery"}</p>
        {apartment.is_hidden_by_admin && (
          <p className="mt-1 text-sm text-muted-foreground">
            {apartment.hidden_reason} · {apartment.hidden_at && new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(apartment.hidden_at))}
          </p>
        )}
        <div className="mt-4"><OperationForm id={id} decision={apartment.is_hidden_by_admin ? "restore" : "hide"} onSubmit={setApartmentVisibility} /></div>
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          {moderation?.map((event) => <li key={event.id}>{event.action.replaceAll("_", " ")} · {event.reason} · {new Date(event.created_at).toLocaleDateString("en-PH")}</li>)}
        </ul>
      </section>
      <section className="rounded-xl border border-border p-4">
        <h2 className="font-nunito text-lg font-bold">Landlord</h2>
        {landlord ? (
          <Link
            className="mt-2 inline-block font-semibold text-primary hover:underline"
            href={`/admin/users/${landlord.id}`}
          >
            {`${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() ||
              landlord.email}
          </Link>
        ) : (
          <p className="text-sm text-muted-foreground">Unavailable</p>
        )}
      </section>
      <section className="rounded-xl border border-border p-4">
        <h2 className="font-nunito text-lg font-bold">Verification history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {history?.length ? (
            history.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="capitalize">
                  {item.status}
                  {item.rejection_reason ? ` — ${item.rejection_reason}` : ""}
                </span>
                <span className="text-muted-foreground">
                  {new Date(item.submitted_at).toLocaleDateString()}
                </span>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">
              No verification submissions.
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
