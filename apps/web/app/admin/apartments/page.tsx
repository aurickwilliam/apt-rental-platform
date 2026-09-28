import { IconBuilding } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";
import ApartmentsClient from "./ApartmentsClient";
import type { AdminApartment } from "./lib/apartment-display";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;
const VALID_STATUSES = [
  "available",
  "occupied",
  "under_maintenance",
  "unverified",
] as const;
interface PageProps {
  searchParams: Promise<{
    q?: string;
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
    verification = "",
    status = "",
    visibility = "",
    page: pageParam,
  } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const statuses = [
    ...new Set(
      status
        .split(",")
        .map((value) => value.trim())
        .filter((value): value is (typeof VALID_STATUSES)[number] =>
          (VALID_STATUSES as readonly string[]).includes(value),
        ),
    ),
  ];
  const supabase = await createClient();
  let query = supabase
    .from("apartments")
    .select(
      "id, name, city, status, is_verified, is_hidden_by_admin, monthly_rent, created_at",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (verification === "verified") query = query.eq("is_verified", true);
  if (verification === "unverified") query = query.eq("is_verified", false);
  if (visibility === "visible") query = query.eq("is_hidden_by_admin", false);
  if (visibility === "hidden") query = query.eq("is_hidden_by_admin", true);
  if (statuses.length) query = query.in("status", statuses);
  if (q.trim()) {
    const term = q.trim();
    const { data: landlords } = await supabase
      .from("users")
      .select("id")
      .filter("roles", "cs", "{landlord}")
      .or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`,
      )
      .limit(100);
    const landlordIds = (landlords ?? []).map((profile) => profile.id);
    query = landlordIds.length
      ? query.or(`name.ilike.%${term}%,landlord_id.in.(${landlordIds.join(",")})`)
      : query.ilike("name", `%${term}%`);
  }
  const {
    data: apartments,
    error,
    count,
  } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  const apartmentRows = (apartments ?? []) as unknown as AdminApartment[];
  const thumbnails = new Map<string, string>();
  if (apartmentRows.length) {
    const { data: covers } = await supabase
      .from("apartment_images")
      .select("apartment_id, url, url_thumb")
      .in(
        "apartment_id",
        apartmentRows.map((apartment) => apartment.id),
      )
      .eq("is_cover", true);
    for (const cover of covers ?? []) {
      if (cover.apartment_id && !thumbnails.has(cover.apartment_id)) {
        thumbnails.set(cover.apartment_id, cover.url_thumb ?? cover.url);
      }
    }
  }
  const apartmentsData = apartmentRows.map((apartment) => ({
    ...apartment,
    thumbnail_url: thumbnails.get(apartment.id) ?? null,
  }));
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <div>
        <h1 className="flex items-center gap-2 font-nunito text-3xl text-primary font-bold">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconBuilding size={28} className="text-primary" aria-hidden="true" />
          </div>
          Apartments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review published and pending property records.
        </p>
      </div>
      <ApartmentsClient
        key={`${q}:${statuses.join(",")}:${verification}:${visibility}`}
        filters={{
          q,
          status: statuses,
          verification,
          visibility,
        }}
        apartments={apartmentsData}
        error={Boolean(error)}
        page={page}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
