import Link from "next/link";
import { Chip } from "@heroui/react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const selected =
    (await searchParams).tab === "apartments" ? "apartments" : "users";
  const supabase = await createClient();
  const [userQueue, apartmentQueue, userCount, apartmentCount] =
    await Promise.all([
      supabase
        .from("user_verifications")
        .select("id, user_id, id_type, submitted_at")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true })
        .limit(50),
      supabase
        .from("apartment_verifications")
        .select("id, apartment_id, submitted_at")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true })
        .limit(50),
      supabase
        .from("user_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("apartment_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);
  const [profiles, apartments] = await Promise.all([
    userQueue.data?.length
      ? supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in(
            "id",
            userQueue.data.map((item) => item.user_id),
          )
      : Promise.resolve({ data: [] }),
    apartmentQueue.data?.length
      ? supabase
          .from("apartments")
          .select("id, name, city")
          .in(
            "id",
            apartmentQueue.data.map((item) => item.apartment_id),
          )
      : Promise.resolve({ data: [] }),
  ]);
  const profileById = new Map(
    (profiles.data ?? []).map((profile) => [profile.id, profile]),
  );
  const apartmentById = new Map(
    (apartments.data ?? []).map((apartment) => [apartment.id, apartment]),
  );
  const rows =
    selected === "users"
      ? (userQueue.data ?? []).map((item) => {
          const profile = profileById.get(item.user_id);
          return {
            id: item.id,
            label:
              `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
              profile?.email ||
              "Unknown applicant",
            detail: `Document: ${item.id_type}`,
            submittedAt: item.submitted_at,
          };
        })
      : (apartmentQueue.data ?? []).map((item) => {
          const apartment = apartmentById.get(item.apartment_id);
          return {
            id: item.id,
            label: apartment?.name || "Unknown apartment",
            detail: apartment?.city || "Location unavailable",
            submittedAt: item.submitted_at,
          };
        });
  const hasError = [userQueue, apartmentQueue, userCount, apartmentCount].some(
    (result) => Boolean(result.error),
  );
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <div>
        <h1 className="font-nunito text-3xl font-bold">Verification</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pending submissions are shown oldest first.
        </p>
      </div>
      {hasError ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load every verification request. Refresh and try again.
        </p>
      ) : null}
      <nav className="flex gap-2" aria-label="Verification queues">
        <Link
          className={`rounded-full px-4 py-2 text-sm font-semibold ${selected === "users" ? "bg-primary text-white" : "bg-muted text-foreground"}`}
          href="/admin/verification?tab=users"
        >
          Users ({userCount.count ?? 0})
        </Link>
        <Link
          className={`rounded-full px-4 py-2 text-sm font-semibold ${selected === "apartments" ? "bg-primary text-white" : "bg-muted text-foreground"}`}
          href="/admin/verification?tab=apartments"
        >
          Apartments ({apartmentCount.count ?? 0})
        </Link>
      </nav>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Submission</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3">
                <span className="sr-only">Review</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="p-3">
                    <p className="font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.detail}
                    </p>
                  </td>
                  <td className="whitespace-nowrap p-3 text-muted-foreground">
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                    }).format(new Date(row.submittedAt))}
                  </td>
                  <td className="p-3">
                    <Chip variant="soft" color="warning">
                      Pending
                    </Chip>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      className="font-semibold text-primary hover:underline"
                      href={`/admin/verification/${selected}/${row.id}`}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  No pending {selected} verification requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
