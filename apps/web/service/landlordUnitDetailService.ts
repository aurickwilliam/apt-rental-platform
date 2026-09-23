import type { createClient as createServerClient } from "@repo/supabase/server";
import { periodMonthLabel } from "@/app/tenant/payment/utils";

type Supabase = Awaited<ReturnType<typeof createServerClient>>;

// ─── Types (mirror mobile landlordService + web Property) ────────────────────
// DB-backed: nullable where the column is nullable. Numbers stay numbers —
// never "" or NaN. Empty numeric inputs coerce to null (see toNullableNumber).

export type LandlordUnitImage = {
  id: string;
  url: string;
  url_thumb: string | null;
  is_cover: boolean | null;
};

export type LandlordUnitApartment = {
  id: string;
  name: string;
  description: string | null;
  monthly_rent: number;
  security_deposit: number | null;
  advance_rent: number | null;
  type: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  zip_code: number | null;
  status: string;
  average_rating: number | null;
  no_ratings: number | null;
  no_bedrooms: number | null;
  no_bathrooms: number | null;
  area_sqm: number | null;
  max_occupants: number | null;
  furnished_type: string | null;
  floor_level: string | null;
  lease_duration: string | null;
  amenities: string[];
  lease_agreement_url: string | null;
  is_verified: boolean | null;
  landlord_id: string;
  apartment_images: LandlordUnitImage[];
};

export type LandlordUnitTenant = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  avatarUrl: string | null;
  leaseStart: string;
  leaseEnd: string | null;
  tenancyId: string;
};

export type LandlordUnitMaintenancePreview = {
  id: string;
  title: string;
  reportedDate: string;
};

export type LandlordUnitPaymentPreview = {
  id: string;
  month: string;
  amount: number;
  paidDate: string;
  status: string;
  method: string | null;
  reference: string | null;
  date: string;
};

export type LandlordUnitDetail = {
  apartment: LandlordUnitApartment;
  tenant: LandlordUnitTenant | null;
  maintenanceRequest: LandlordUnitMaintenancePreview | null;
  recentPayments: LandlordUnitPaymentPreview[];
};

export type LandlordUnitReview = {
  id: string;
  name: string;
  date: string;
  rating: number;
  review: string;
  profilePictureUrl?: string;
  stayPeriod?: string;
  images?: string[];
};

// ─── Selects (same tables/columns as mobile) ─────────────────────────────────

const APARTMENT_SELECT = `
  id, name, description, monthly_rent, security_deposit, advance_rent, type,
  street_address, barangay, city, province, zip_code, status,
  average_rating, no_ratings, no_bedrooms, no_bathrooms, area_sqm,
  max_occupants, furnished_type, floor_level, lease_duration,
  amenities, lease_agreement_url, is_verified, landlord_id,
  apartment_images (id, url, url_thumb, is_cover)
`;

const TENANCY_SELECT = `
  id,
  lease_start,
  lease_end,
  tenant:users!tenancies_tenant_id_fkey (
    id,
    first_name,
    last_name,
    mobile_number,
    email,
    avatar_url
  )
`;

const MAINTENANCE_PREVIEW_SELECT = "id, title, created_at";

const PAYMENT_PREVIEW_SELECT =
  "id, amount, date, status, method, reference_id, due_date, period_start";

const REVIEW_SELECT = `
  id,
  rating,
  comment,
  created_at,
  image_paths,
  users!reviews_tenant_id_fkey (
    first_name,
    last_name,
    avatar_url
  ),
  tenancy:tenancy_id (
    lease_start,
    lease_end
  )
`;

export const LANDLORD_UNIT_PAYMENTS_LIMIT = 200;
const RECENT_PAYMENTS_LIMIT = 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Numeric form input → DB value. "" / NaN become null, never 0-by-accident. */
export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

function toPaidDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function toReportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatStayPeriod(leaseStart: string | null, leaseEnd: string | null): string | undefined {
  if (!leaseStart) return undefined;
  const fmt = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return `${fmt(leaseStart)} - ${leaseEnd ? fmt(leaseEnd) : "Present"}`;
}

// ─── Detail (mobile fetchLandlordTenancy + apartment in one Promise.all) ─────

type TenancyRow = {
  id: string;
  lease_start: string;
  lease_end: string | null;
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
    mobile_number: string;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

export async function fetchLandlordUnitDetail(
  supabase: Supabase,
  apartmentId: string,
): Promise<LandlordUnitDetail | null> {
  const [apartmentResult, tenancyResult, maintenanceResult, paymentsResult] = await Promise.all([
    supabase
      .from("apartments")
      .select(APARTMENT_SELECT)
      .eq("id", apartmentId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("tenancies")
      .select(TENANCY_SELECT)
      .eq("apartment_id", apartmentId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("maintenance_request")
      .select(MAINTENANCE_PREVIEW_SELECT)
      .eq("apartment_id", apartmentId)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payment")
      .select(PAYMENT_PREVIEW_SELECT)
      .eq("apartment_id", apartmentId)
      .in("status", ["paid", "pending"])
      .order("date", { ascending: false })
      .limit(RECENT_PAYMENTS_LIMIT),
  ]);

  if (apartmentResult.error) throw apartmentResult.error;
  if (tenancyResult.error) throw tenancyResult.error;
  if (maintenanceResult.error) throw maintenanceResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const apartment = apartmentResult.data as unknown as LandlordUnitApartment | null;
  if (!apartment) return null;

  const tenancyData = tenancyResult.data as unknown as TenancyRow | null;
  const tenant: LandlordUnitTenant | null = tenancyData?.tenant
    ? {
        id: tenancyData.tenant.id,
        fullName:
          `${tenancyData.tenant.first_name ?? ""} ${tenancyData.tenant.last_name ?? ""}`.trim() ||
          "Tenant",
        email: tenancyData.tenant.email ?? "—",
        mobileNumber: tenancyData.tenant.mobile_number,
        avatarUrl: tenancyData.tenant.avatar_url,
        leaseStart: tenancyData.lease_start,
        leaseEnd: tenancyData.lease_end,
        tenancyId: tenancyData.id,
      }
    : null;

  const maintData = maintenanceResult.data as unknown as {
    id: string;
    title: string;
    created_at: string;
  } | null;
  const maintenanceRequest: LandlordUnitMaintenancePreview | null = maintData
    ? { id: maintData.id, title: maintData.title, reportedDate: toReportDate(maintData.created_at) }
    : null;

  const recentPayments: LandlordUnitPaymentPreview[] = (
    (paymentsResult.data ?? []) as unknown as {
      id: string;
      amount: number | null;
      date: string;
      status: string;
      method: string | null;
      reference_id: string | null;
      due_date: string | null;
      period_start: string | null;
    }[]
  ).map((p) => ({
    id: p.id,
    month: periodMonthLabel(p.due_date ?? p.period_start ?? p.date),
    amount: Number(p.amount ?? 0),
    paidDate: toPaidDate(p.date),
    status: p.status,
    method: p.method,
    reference: p.reference_id,
    date: p.date,
  }));

  return {
    apartment: { ...apartment, amenities: apartment.amenities ?? [] },
    tenant,
    maintenanceRequest,
    recentPayments,
  };
}

// ─── Reviews (mobile reviewsService, per-apartment) ──────────────────────────

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  image_paths: string[] | null;
  users: { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
  tenancy: { lease_start: string; lease_end: string | null } | null;
};

export function getLandlordReviewImageUrls(
  supabase: Supabase,
  paths: string[] | null,
): string[] | undefined {
  if (!paths || paths.length === 0) return undefined;
  return paths.map(
    (path) => supabase.storage.from("review-images").getPublicUrl(path).data.publicUrl,
  );
}

export async function fetchLandlordUnitReviews(
  supabase: Supabase,
  apartmentId: string,
): Promise<LandlordUnitReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("apartment_id", apartmentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as ReviewRow[]).map((row) => {
    const name =
      `${row.users?.first_name ?? ""} ${row.users?.last_name ?? ""}`.trim() || "Anonymous Tenant";
    return {
      id: row.id,
      name,
      date: row.created_at,
      rating: Number(row.rating),
      review: row.comment ?? "",
      profilePictureUrl: row.users?.avatar_url ?? undefined,
      stayPeriod: formatStayPeriod(row.tenancy?.lease_start ?? null, row.tenancy?.lease_end ?? null),
      images: getLandlordReviewImageUrls(supabase, row.image_paths),
    };
  });
}

// ─── Mutations (mobile manage-apartment actions, same guards) ────────────────
// Terminal tenancy status is 'ended'; the
// sync_apartment_available_on_tenancy_update trigger flips the apartment to
// available — the explicit apartment update is belt-and-suspenders.

export async function vacateLandlordUnit(
  supabase: Supabase,
  apartmentId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error: tenancyError } = await supabase
    .from("tenancies")
    .update({ status: "ended" })
    .eq("apartment_id", apartmentId)
    .eq("status", "active");

  if (tenancyError) return { success: false, error: tenancyError.message };

  const { error: apartmentError } = await supabase
    .from("apartments")
    .update({ status: "available" })
    .eq("id", apartmentId);

  if (apartmentError) return { success: false, error: apartmentError.message };
  return { success: true };
}

export async function removeLandlordUnit(
  supabase: Supabase,
  apartmentId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("apartments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", apartmentId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
