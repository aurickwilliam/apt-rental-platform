import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../_lib/require-admin";
import OperationForm from "../../OperationForm";
import { setUserAccess } from "../../actions/operations";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: user }, { data: verifications }, { data: apartments }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, first_name, last_name, email, role, account_status, is_suspended, suspended_at, suspension_reason")
        .eq("id", id)
        .single(),
      supabase
        .from("user_verifications")
        .select("id, status, submitted_at, rejection_reason")
        .eq("user_id", id)
        .order("submitted_at", { ascending: false })
        .limit(20),
      supabase
        .from("apartments")
        .select("id, name, is_verified, status")
        .eq("landlord_id", id)
        .is("deleted_at", null)
        .limit(20),
    ]);
  if (!user) notFound();
  const verificationIds = (verifications ?? []).map(
    (verification) => verification.id,
  );
  const { data: activity } = await supabase
    .from("admin_audit_logs")
    .select("id, action, reason, created_at")
    .or(`and(target_type.eq.user,target_id.eq.${id})${verificationIds.map((item) => `,and(target_type.eq.user_verification,target_id.eq.${item})`).join("")}`)
    .order("created_at", { ascending: false })
    .limit(20);
  const name =
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "User";
  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4">
      <div>
        <h1 className="font-nunito text-3xl font-bold">{name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.email} · {user.role} · {user.account_status}
        </p>
      </div>
      {user.role !== "admin" && (
        <section className="rounded-xl border border-border p-4">
          <h2 className="font-nunito text-lg font-bold">Account access</h2>
          <p className="mt-2 text-sm font-semibold">{user.is_suspended ? "Suspended" : "Active"}</p>
          {user.is_suspended && (
            <p className="mt-1 text-sm text-muted-foreground">
              {user.suspension_reason} · {user.suspended_at && new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(user.suspended_at))}
            </p>
          )}
          {user.id !== admin.id && (
            <div className="mt-4">
              <OperationForm id={user.id} decision={user.is_suspended ? "reactivate" : "suspend"} onSubmit={setUserAccess} />
            </div>
          )}
        </section>
      )}
      <section className="rounded-xl border border-border p-4">
        <h2 className="font-nunito text-lg font-bold">Verification history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {verifications?.length ? (
            verifications.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="wrap-break-word capitalize">
                  {item.status}
                  {item.rejection_reason ? ` — ${item.rejection_reason}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Intl.DateTimeFormat("en-PH", {
                    dateStyle: "medium",
                  }).format(new Date(item.submitted_at))}
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
      {user.role === "landlord" ? (
        <section className="rounded-xl border border-border p-4">
          <h2 className="font-nunito text-lg font-bold">Owned apartments</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {apartments?.length ? (
              apartments.map((apartment) => (
                <li key={apartment.id}>
                  <Link
                    className="font-semibold text-primary hover:underline"
                    href={`/admin/apartments/${apartment.id}`}
                  >
                    {apartment.name}
                  </Link>{" "}
                  · {apartment.is_verified ? "Verified" : "Unverified"}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">No active apartments.</li>
            )}
          </ul>
        </section>
      ) : null}
      <section className="rounded-xl border border-border p-4">
        <h2 className="font-nunito text-lg font-bold">Account and review activity</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {activity?.length ? (
            activity.map((event) => (
              <li key={event.id} className="flex justify-between gap-3">
                <span className="wrap-break-word">
                  {event.action.replaceAll("_", " ")}
                  {event.reason ? ` — ${event.reason}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Intl.DateTimeFormat("en-PH", {
                    dateStyle: "medium",
                  }).format(new Date(event.created_at))}
                </span>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">No review activity yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
