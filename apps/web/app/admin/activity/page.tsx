import { IconHistory } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";
import ActivityClient from "./ActivityClient";
import type {
  ActivityAdmin,
  AdminActivityEvent,
} from "./lib/activity-display";

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
    data: eventsData,
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
  const events = ((eventsData ?? []) as unknown as Array<{
    id: string;
    action: string;
    target_type: string;
    target_id: string;
    reason: string | null;
    created_at: string;
    users: ActivityAdmin | ActivityAdmin[] | null;
  }>).map(
    (event): AdminActivityEvent => ({
      id: event.id,
      action: event.action,
      target_type: event.target_type,
      target_id: event.target_id,
      reason: event.reason,
      created_at: event.created_at,
      admin: Array.isArray(event.users)
        ? (event.users[0] ?? null)
        : event.users,
    }),
  );
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <div>
        <h1 className="flex items-center gap-2 font-nunito text-3xl text-primary font-bold">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconHistory size={28} className="text-primary" aria-hidden="true" />
          </div>
          Activity
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account access, listing moderation, and verification review history.
        </p>
      </div>
      <ActivityClient
        key={page}
        events={events}
        error={Boolean(error)}
        page={page}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
