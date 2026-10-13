import { IconBuilding } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";
import ApartmentsClient from "./ApartmentsClient";
import type { AdminApartment } from "./lib/apartment-display";
import {
  locationOrFilter,
  parseApartmentFilters,
  type ApartmentSearchParams,
  type ApartmentSort,
} from "./lib/apartment-filters";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;
const APARTMENT_COLUMNS =
  "id, name, city, status, is_verified, is_hidden_by_admin, monthly_rent, created_at, apartment_images(url, url_thumb)";

type ApartmentRow = Omit<AdminApartment, "thumbnail_url"> & {
  apartment_images: { url: string; url_thumb: string | null }[];
};

const APARTMENT_SORT_ORDER: Record<
  ApartmentSort,
  { column: "created_at" | "name" | "monthly_rent"; ascending: boolean }
> = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  name_asc: { column: "name", ascending: true },
  name_desc: { column: "name", ascending: false },
  rent_asc: { column: "monthly_rent", ascending: true },
  rent_desc: { column: "monthly_rent", ascending: false },
};

interface PageProps {
  searchParams: Promise<ApartmentSearchParams>;
}

export default async function ApartmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filters = parseApartmentFilters(params);
  const page = Math.max(1, Number(params.page) || 1);
  const supabase = await createClient();
  const locationFilter = locationOrFilter(filters.locations);

  async function loadApartments() {
    let landlordIds: string[] = [];
    if (filters.q) {
      const { data: landlords } = await supabase
        .from("users")
        .select("id")
        .filter("roles", "cs", "{landlord}")
        .or(
          `first_name.ilike.%${filters.q}%,last_name.ilike.%${filters.q}%,email.ilike.%${filters.q}%`,
        )
        .limit(100);
      landlordIds = (landlords ?? []).map((profile) => profile.id);
    }

    const { column, ascending } = APARTMENT_SORT_ORDER[filters.sort];
    let query = supabase
      .from("apartments")
      .select(APARTMENT_COLUMNS, { count: "exact" })
      .is("deleted_at", null)
      // Only the cover image is embedded, in the same request as the rows.
      .eq("apartment_images.is_cover", true)
      .limit(1, { referencedTable: "apartment_images" });
    if (filters.statuses.length) query = query.in("status", filters.statuses);
    if (filters.verification !== "all")
      query = query.eq("is_verified", filters.verification === "verified");
    if (filters.visibility !== "all")
      query = query.eq("is_hidden_by_admin", filters.visibility === "hidden");
    if (locationFilter) query = query.or(locationFilter);
    if (filters.q)
      query = landlordIds.length
        ? query.or(
            `name.ilike.%${filters.q}%,landlord_id.in.(${landlordIds.join(",")})`,
          )
        : query.ilike("name", `%${filters.q}%`);

    return query
      .order(column, { ascending, nullsFirst: false })
      // Tiebreaker keeps pagination stable when sort values repeat.
      .order("id", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  }

  // The admin check runs alongside the queries instead of before them: RLS
  // already limits what a non-admin could read, and nothing renders unless
  // the check passes (it redirects or throws otherwise).
  const [, { data, error, count }] = await Promise.all([
    requireAdmin(),
    loadApartments(),
  ]);
  if (error) console.error("Admin apartments query failed", error);

  const apartmentsData: AdminApartment[] = (
    (data ?? []) as unknown as ApartmentRow[]
  ).map(({ apartment_images: covers, ...apartment }) => ({
    ...apartment,
    thumbnail_url: covers[0]?.url_thumb ?? covers[0]?.url ?? null,
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
        filters={filters}
        apartments={apartmentsData}
        error={Boolean(error)}
        page={page}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
