import { createClient } from "@repo/supabase/server";
import { resolveJoinedRange } from "@/lib/admin-filters";
import { requireAdmin } from "../_lib/require-admin";
import UsersClient from "./UsersClient";
import type { AdminUser } from "./lib/user-display";
import {
  parseUserFilters,
  type UserSearchParams,
  type UserSort,
} from "./lib/user-filters";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 30;
const USER_COLUMNS =
  "id, first_name, last_name, email, avatar_url, roles, account_status, is_suspended, created_at";

type UserSortColumn = "created_at" | "first_name" | "last_name" | "updated_at";
const USER_SORT_ORDER: Record<
  UserSort,
  { column: UserSortColumn; ascending: boolean }[]
> = {
  newest: [{ column: "created_at", ascending: false }],
  oldest: [{ column: "created_at", ascending: true }],
  name_asc: [
    { column: "first_name", ascending: true },
    { column: "last_name", ascending: true },
  ],
  name_desc: [
    { column: "first_name", ascending: false },
    { column: "last_name", ascending: false },
  ],
  updated: [{ column: "updated_at", ascending: false }],
};

interface PageProps {
  searchParams: Promise<UserSearchParams>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseUserFilters(params);
  const page = Math.max(1, Number(params.page) || 1);
  const joinedRange = resolveJoinedRange(filters.joined, filters.from, filters.to);
  const supabase = await createClient();

  let query = supabase
    .from("users")
    .select(USER_COLUMNS, { count: "exact" });
  if (filters.verifications.length)
    query = query.in("account_status", filters.verifications);
  if (filters.roles.length)
    query = query.filter("roles", "ov", `{${filters.roles.join(",")}}`);
  if (filters.access !== "all")
    query = query.eq("is_suspended", filters.access === "suspended");
  if (joinedRange?.from) query = query.gte("created_at", joinedRange.from);
  if (joinedRange?.before) query = query.lt("created_at", joinedRange.before);
  if (filters.q)
    query = query.or(
      `first_name.ilike.%${filters.q}%,last_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`,
    );
  for (const { column, ascending } of USER_SORT_ORDER[filters.sort])
    query = query.order(column, { ascending, nullsFirst: false });
  // Tiebreaker keeps pagination stable when sort values repeat.
  query = query.order("id", { ascending: true });

  const { data, error, count } = await query.range(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE - 1,
  );
  if (error) console.error("Admin users query failed", error);

  return (
    <UsersClient
      key={JSON.stringify(filters)}
      users={(data ?? []) as unknown as AdminUser[]}
      error={Boolean(error)}
      filters={filters}
      page={page}
      totalCount={count ?? 0}
      pageSize={PAGE_SIZE}
    />
  );
}
