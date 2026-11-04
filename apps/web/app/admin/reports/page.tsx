import { IconFlag } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { parseReportFilters } from "@/lib/user-reports";
import { requireAdmin } from "../_lib/require-admin";
import ReportsClient from "./ReportsClient";
import type { AdminUserReport } from "./lib/report-types";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string; type?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filters = parseReportFilters(params);
  const { status, type } = filters;
  const supabase = await createClient();

  // user_reports has three FKs to users, so each join names its constraint.
  let query = supabase
    .from("user_reports")
    .select(
      `id, reason, details, status, resolution_note, created_at, resolved_at, target_type, action_taken,
       reporter:users!user_reports_reporter_id_fkey(id, first_name, last_name, email),
       reported:users!user_reports_reported_user_id_fkey(id, first_name, last_name, email, is_suspended),
       apartment:apartments!user_reports_apartment_id_fkey(id, name, is_hidden_by_admin)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (status !== "all") query = query.eq("status", status);
  if (type !== "all") query = query.eq("target_type", type);

  // Search matches the reported person, the reporter or the listing by name.
  if (filters.q) {
    const term = `%${filters.q}%`;
    const [{ data: people }, { data: listings }] = await Promise.all([
      supabase
        .from("users")
        .select("id")
        .or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`)
        .limit(100),
      supabase.from("apartments").select("id").ilike("name", term).limit(100),
    ]);
    const personIds = (people ?? []).map((person) => person.id).join(",");
    const listingIds = (listings ?? []).map((listing) => listing.id).join(",");
    const conditions = [
      personIds && `reported_user_id.in.(${personIds})`,
      personIds && `reporter_id.in.(${personIds})`,
      listingIds && `apartment_id.in.(${listingIds})`,
    ].filter(Boolean);
    // No match: a condition no row can satisfy, so the page shows the empty state.
    query = query.or(conditions.length ? conditions.join(",") : "id.eq.00000000-0000-0000-0000-000000000000");
  }

  const { data, error, count } = await query;
  if (error) console.error("Admin reports failed to load", error);

  const reports = ((data ?? []) as unknown as Array<
    Omit<AdminUserReport, "reporter" | "reported" | "apartment"> & {
      reporter: AdminUserReport["reporter"] | AdminUserReport["reporter"][];
      reported: AdminUserReport["reported"] | AdminUserReport["reported"][];
      apartment: AdminUserReport["apartment"] | AdminUserReport["apartment"][];
    }
  >).map(
    (report): AdminUserReport => ({
      ...report,
      reporter: one(report.reporter),
      reported: one(report.reported),
      apartment: one(report.apartment),
    }),
  );

  return (
    <div className="w-full space-y-5 p-4">
      <div>
        <h1 className="flex items-center gap-2 font-nunito text-3xl text-primary font-bold">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconFlag size={28} className="text-primary" aria-hidden="true" />
          </div>
          Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reports on apartments, landlords, tenants and chats. Review the report, then warn, hide the listing, suspend the account, or dismiss it.
        </p>
      </div>
      <ReportsClient
        reports={reports}
        error={Boolean(error)}
        filters={filters}
        page={page}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
