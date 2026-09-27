import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
interface PageProps {
  searchParams: Promise<{
    q?: string;
    role?: string;
    verification?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const {
    q = "",
    role = "",
    verification = "",
    page: pageParam,
  } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();
  let query = supabase
    .from("users")
    .select(
      "id, first_name, last_name, email, role, account_status, is_suspended, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });
  if (["tenant", "landlord", "admin"].includes(role))
    query = query.eq("role", role);
  if (["unverified", "pending", "verified", "rejected"].includes(verification))
    query = query.eq("account_status", verification);
  if (q.trim())
    query = query.or(
      `first_name.ilike.%${q.trim()}%,last_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`,
    );
  const {
    data: users,
    error,
    count,
  } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const params = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(role ? { role } : {}),
    ...(verification ? { verification } : {}),
  });
  const hrefFor = (targetPage: number) =>
    `/admin/users?${new URLSearchParams({ ...Object.fromEntries(params), page: String(targetPage) })}`;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <div>
        <h1 className="font-nunito text-3xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search tenant, landlord, and administrator accounts.
        </p>
      </div>
      <form className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="user-search">
          Search users
        </label>
        <input
          id="user-search"
          name="q"
          defaultValue={q}
          placeholder="Search name or email…"
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <label className="sr-only" htmlFor="user-role">
          Role
        </label>
        <select
          id="user-role"
          name="role"
          defaultValue={role}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="">All roles</option>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
          <option value="admin">Administrator</option>
        </select>
        <label className="sr-only" htmlFor="user-verification">
          Verification status
        </label>
        <select
          id="user-verification"
          name="verification"
          defaultValue={verification}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="">All verification statuses</option>
          <option value="unverified">Unverified</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">
          Apply
        </button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load users. Refresh and try again.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Access</th>
                  <th className="p-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users?.length ? (
                  users.map((user) => (
                    <tr key={user.id} className="border-t border-border">
                      <td className="p-3">
                        <p className="font-medium">
                          {`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                            "Unnamed user"}
                        </p>
                        <p className="text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="p-3 capitalize">{user.role}</td>
                      <td className="p-3 capitalize">{user.account_status}</td>
                      <td className="p-3">{user.is_suspended ? "Suspended" : "Active"}</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No users match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            hasNext={(count ?? 0) > page * PAGE_SIZE}
            previousHref={hrefFor(page - 1)}
            nextHref={hrefFor(page + 1)}
          />
        </>
      )}
    </div>
  );
}

function Pagination({
  page,
  hasNext,
  previousHref,
  nextHref,
}: {
  page: number;
  hasNext: boolean;
  previousHref: string;
  nextHref: string;
}) {
  return (
    <nav
      className="flex items-center justify-between"
      aria-label="User pagination"
    >
      <Link
        aria-disabled={page === 1}
        className={`text-sm font-semibold text-primary hover:underline ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
        href={previousHref}
      >
        Previous
      </Link>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Link
        aria-disabled={!hasNext}
        className={`text-sm font-semibold text-primary hover:underline ${!hasNext ? "pointer-events-none opacity-50" : ""}`}
        href={nextHref}
      >
        Next
      </Link>
    </nav>
  );
}
