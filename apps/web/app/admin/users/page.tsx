import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";
import UsersClient, { type AdminUser } from "./UsersClient";

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
      "id, first_name, last_name, email, avatar_url, roles, account_status, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });
  if (["tenant", "landlord", "admin"].includes(role))
    query = query.filter("roles", "cs", `{${role}}`);
  if (["unverified", "pending", "verified", "rejected"].includes(verification))
    query = query.eq("account_status", verification);
  if (q.trim())
    query = query.or(
      `first_name.ilike.%${q.trim()}%,last_name.ilike.%${q.trim()}%,email.ilike.%${q.trim()}%`,
    );
  const {
    data: usersData,
    error,
    count,
  } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const users = usersData as unknown as AdminUser[] | null;
  return (
    <UsersClient
      key={`${q}:${role}:${verification}`}
      users={users ?? []}
      error={Boolean(error)}
      filters={{ q, role, verification }}
      page={page}
      totalCount={count ?? 0}
      pageSize={PAGE_SIZE}
    />
  );
}
