import { IconFlag } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { parseReportStatusFilter, parseReportTypeFilter } from "@/lib/user-reports";
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
  searchParams: Promise<{ page?: string; status?: string; type?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = parseReportStatusFilter(params.status);
  const type = parseReportTypeFilter(params.type);
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
        key={`${status}-${type}-${page}`}
        reports={reports}
        error={Boolean(error)}
        status={status}
        type={type}
        page={page}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
