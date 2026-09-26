import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const supabase = await createClient();
  const {
    data: events,
    error,
    count,
  } = await supabase
    .from("admin_audit_logs")
    .select(
      "id, admin_id, action, target_type, target_id, reason, created_at, users!admin_audit_logs_admin_id_fkey(first_name, last_name, email)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const hasNext = (count ?? 0) > page * PAGE_SIZE;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <div>
        <h1 className="font-nunito text-3xl font-bold">Activity</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account access, listing moderation, and verification review history.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load activity. Refresh and try again.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Reviewed by</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">When</th>
                </tr>
              </thead>
              <tbody>
                {events?.length ? (
                  events.map((event) => {
                    const admin = event.users;
                    const name = admin
                      ? `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim() ||
                        admin.email ||
                        "Administrator"
                      : "Administrator";
                    return (
                      <tr key={event.id} className="border-t border-border">
                        <td className="p-3 font-medium">
                          {event.action.replaceAll("_", " ")}
                        </td>
                        <td className="p-3">{name}</td>
                        <td className="p-3 capitalize">
                          {event.target_type === "user" || event.target_type === "apartment" ? (
                            <Link className="font-semibold text-primary hover:underline" href={`/admin/${event.target_type === "user" ? "users" : "apartments"}/${event.target_id}`}>
                              {event.target_type}
                            </Link>
                          ) : event.target_type.replaceAll("_", " ")}
                        </td>
                        <td className="max-w-72 wrap-break-word p-3 text-muted-foreground">
                          {event.reason ?? "—"}
                        </td>
                        <td className="whitespace-nowrap p-3 text-muted-foreground">
                          {new Intl.DateTimeFormat("en-PH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(event.created_at))}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No review activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <nav
            className="flex items-center justify-between"
            aria-label="Activity pagination"
          >
            <Link
              aria-disabled={page === 1}
              className={`text-sm font-semibold text-primary hover:underline ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
              href={`/admin/activity?page=${page - 1}`}
            >
              Previous
            </Link>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Link
              aria-disabled={!hasNext}
              className={`text-sm font-semibold text-primary hover:underline ${!hasNext ? "pointer-events-none opacity-50" : ""}`}
              href={`/admin/activity?page=${page + 1}`}
            >
              Next
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
