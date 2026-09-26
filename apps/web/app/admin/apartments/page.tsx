import Link from "next/link";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
interface PageProps {
  searchParams: Promise<{
    q?: string;
    landlord?: string;
    verification?: string;
    status?: string;
    visibility?: string;
    page?: string;
  }>;
}

export default async function ApartmentsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const {
    q = "",
    landlord = "",
    verification = "",
    status = "",
    visibility = "",
    page: pageParam,
  } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const supabase = await createClient();
  let query = supabase
    .from("apartments")
    .select("id, name, city, status, is_verified, is_hidden_by_admin, monthly_rent", {
      count: "exact",
    })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (verification === "verified") query = query.eq("is_verified", true);
  if (verification === "unverified") query = query.eq("is_verified", false);
  if (visibility === "visible") query = query.eq("is_hidden_by_admin", false);
  if (visibility === "hidden") query = query.eq("is_hidden_by_admin", true);
  if (
    ["available", "occupied", "under_maintenance", "unverified"].includes(
      status,
    )
  )
    query = query.eq("status", status);
  if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
  if (landlord.trim()) {
    const { data: landlords } = await supabase
      .from("users")
      .select("id")
      .eq("role", "landlord")
      .or(
        `first_name.ilike.%${landlord.trim()}%,last_name.ilike.%${landlord.trim()}%,email.ilike.%${landlord.trim()}%`,
      )
      .limit(100);
    query = query.in(
      "landlord_id",
      (landlords ?? []).map((profile) => profile.id),
    );
  }
  const {
    data: apartments,
    error,
    count,
  } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const params = new URLSearchParams({
    ...(q ? { q } : {}),
    ...(landlord ? { landlord } : {}),
    ...(verification ? { verification } : {}),
    ...(status ? { status } : {}),
    ...(visibility ? { visibility } : {}),
  });
  const hrefFor = (targetPage: number) =>
    `/admin/apartments?${new URLSearchParams({ ...Object.fromEntries(params), page: String(targetPage) })}`;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <div>
        <h1 className="font-nunito text-3xl font-bold">Apartments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review published and pending property records.
        </p>
      </div>
      <form className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="apartment-search">
          Search apartments
        </label>
        <input
          id="apartment-search"
          name="q"
          defaultValue={q}
          placeholder="Search apartments…"
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <label className="sr-only" htmlFor="landlord-search">
          Search landlords
        </label>
        <input
          id="landlord-search"
          name="landlord"
          defaultValue={landlord}
          placeholder="Search landlords…"
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <label className="sr-only" htmlFor="apartment-verification">
          Verification status
        </label>
        <select
          id="apartment-verification"
          name="verification"
          defaultValue={verification}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="">All verification statuses</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
        <label className="sr-only" htmlFor="apartment-status">
          Listing status
        </label>
        <select
          id="apartment-status"
          name="status"
          defaultValue={status}
          className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
        >
          <option value="">All listing statuses</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="under_maintenance">Under maintenance</option>
          <option value="unverified">Unverified</option>
        </select>
        <label className="sr-only" htmlFor="apartment-visibility">Visibility</label>
        <select id="apartment-visibility" name="visibility" defaultValue={visibility} className="h-10 rounded-xl border border-border bg-card px-3 text-sm">
          <option value="">All visibility</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <button className="rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90">
          Apply
        </button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load apartments. Refresh and try again.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Apartment</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verification</th>
                  <th className="p-3">Visibility</th>
                  <th className="p-3">
                    <span className="sr-only">Details</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {apartments?.length ? (
                  apartments.map((apartment) => (
                    <tr key={apartment.id} className="border-t border-border">
                      <td className="p-3">
                        <p className="font-medium">{apartment.name}</p>
                        <p className="text-muted-foreground">
                          {apartment.city}
                        </p>
                      </td>
                      <td className="p-3 capitalize">{apartment.status}</td>
                      <td className="p-3">
                        {apartment.is_verified ? "Verified" : "Unverified"}
                      </td>
                      <td className="p-3">{apartment.is_hidden_by_admin ? "Hidden by admin" : "Visible"}</td>
                      <td className="p-3 text-right">
                        <Link
                          href={`/admin/apartments/${apartment.id}`}
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
                      No apartments match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <nav
            className="flex items-center justify-between"
            aria-label="Apartment pagination"
          >
            <Link
              aria-disabled={page === 1}
              className={`text-sm font-semibold text-primary hover:underline ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
              href={hrefFor(page - 1)}
            >
              Previous
            </Link>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Link
              aria-disabled={(count ?? 0) <= page * PAGE_SIZE}
              className={`text-sm font-semibold text-primary hover:underline ${(count ?? 0) <= page * PAGE_SIZE ? "pointer-events-none opacity-50" : ""}`}
              href={hrefFor(page + 1)}
            >
              Next
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
