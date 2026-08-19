import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@repo/supabase";
import { formatAddress } from "@repo/utils";
import { ApartmentStatus, VALID_APARTMENT_STATUSES } from "@repo/constants";

import { resolvePrivateMediaUrls } from "@/service/media/privateMediaResolver";

import type { MaintenanceRequestStatus } from "@/service/maintenance-requests/maintenanceService";

export type { MaintenanceRequestStatus };

// ─── Landlord units ───────────────────────────────────────────────────────────

export type LandlordUnitApartment = {
  id: string;
  name: string;
  barangay: string;
  city: string;
  status: ApartmentStatus;
  isVerified: boolean;
  coverUrl: string | null;
  monthlyRent?: number;
};

export type LandlordUnitsResult = {
  apartments: LandlordUnitApartment[];
  monthlyProfit: number;
};

async function fetchMonthlyProfit(landlordId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: aptData, error: aptError } = await supabase
    .from("apartments")
    .select("id")
    .eq("landlord_id", landlordId)
    .is("deleted_at", null);

  if (aptError) throw aptError;

  const apartmentIds = (aptData ?? []).map((a) => a.id);
  if (apartmentIds.length === 0) return 0;

  const { data: payments, error: payError } = await supabase
    .from("payment")
    .select("amount")
    .in("apartment_id", apartmentIds)
    .eq("status", "paid")
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  if (payError) throw payError;

  return (payments ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
}

export async function fetchLandlordUnits(landlordId: string): Promise<LandlordUnitsResult> {
  const [apartmentsResult, monthlyProfit] = await Promise.all([
    supabase
      .from("apartments")
      .select("id, name, barangay, city, status, is_verified, apartment_images (url, url_thumb, is_cover), monthly_rent")
      .eq("landlord_id", landlordId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    fetchMonthlyProfit(landlordId),
  ]);

  if (apartmentsResult.error) throw apartmentsResult.error;

  const mapped: LandlordUnitApartment[] = (apartmentsResult.data ?? []).map((apt) => {
    const images = apt.apartment_images ?? [];
    const cover = images.find((img) => img.is_cover) ?? images[0] ?? null;
    const rawStatus = apt.status ?? "available";

    return {
      id: apt.id,
      name: apt.name,
      barangay: apt.barangay,
      city: apt.city,
      status: VALID_APARTMENT_STATUSES.includes(rawStatus as ApartmentStatus)
        ? (rawStatus as ApartmentStatus)
        : "available",
      isVerified: apt.is_verified ?? false,
      coverUrl: (cover?.url_thumb || cover?.url) ?? null,
      monthlyRent: apt.monthly_rent ?? undefined,
    };
  });

  return { apartments: mapped, monthlyProfit };
}

// ─── Landlord action badges ───────────────────────────────────────────────────

export type ActionBadgeCategory = "maintenance" | "visits" | "applications";
export type ActionBadgeCounts = Record<ActionBadgeCategory, number>;

const STORAGE_PREFIX = "badge_last_viewed:";

const TABLE_MAP = {
  maintenance: "maintenance_request",
  visits: "visit_request",
  applications: "rental_application",
} as const;

async function getLastViewed(category: ActionBadgeCategory): Promise<string> {
  const stored = await AsyncStorage.getItem(STORAGE_PREFIX + category);
  return stored ?? new Date(0).toISOString();
}

// m3: apartment IDs change rarely — cache them briefly so badge refreshes
// don't re-fetch the same `select("id")` list on every count.
const APARTMENT_IDS_TTL_MS = 60_000;
let cachedApartmentIds: string[] | null = null;
let apartmentIdsCachedAt = 0;

async function fetchLandlordApartmentIds(landlordId: string): Promise<string[]> {
  const now = Date.now();
  if (cachedApartmentIds && now - apartmentIdsCachedAt < APARTMENT_IDS_TTL_MS) {
    return cachedApartmentIds;
  }

  const { data: aptData, error: aptError } = await supabase
    .from("apartments")
    .select("id")
    .eq("landlord_id", landlordId)
    .is("deleted_at", null);
  if (aptError) throw aptError;

  cachedApartmentIds = (aptData ?? []).map((a) => a.id);
  apartmentIdsCachedAt = now;
  return cachedApartmentIds;
}

export async function fetchLandlordBadges(landlordId: string): Promise<ActionBadgeCounts> {
  const apartmentIds = await fetchLandlordApartmentIds(landlordId);
  if (apartmentIds.length === 0) {
    return { maintenance: 0, visits: 0, applications: 0 };
  }

  const categories: ActionBadgeCategory[] = ["maintenance", "visits", "applications"];

  const results = await Promise.all(
    categories.map(async (category) => {
      const lastViewed = await getLastViewed(category);
      const { count, error } = await supabase
        .from(TABLE_MAP[category])
        .select("id", { count: "exact", head: true })
        .in("apartment_id", apartmentIds)
        .eq("status", "pending")
        .gt("created_at", lastViewed);
      if (error) throw error;
      return [category, count ?? 0] as const;
    })
  );

  return Object.fromEntries(results) as ActionBadgeCounts;
}

// ─── Landlord tenancy (manage-apartment dashboard) ────────────────────────────

export type LandlordTenant = {
  id: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  avatarUrl: string | null;
  leaseStart: string;
  leaseEnd: string | null;
  tenancyId: string;
};

export type LandlordTenancyMaintenanceRequest = {
  id: string;
  title: string;
  reportedDate: string;
};

export type PaymentRecord = {
  id: string;
  month: string;
  year: string;
  amount: number;
  paidDate: string;
  status: "paid" | "partial" | "pending";
};

export type LandlordTenancyResult = {
  tenant: LandlordTenant | null;
  maintenanceRequest: LandlordTenancyMaintenanceRequest | null;
  paymentHistory: PaymentRecord[];
};

export async function fetchLandlordTenancy(
  apartmentId: string
): Promise<LandlordTenancyResult> {
  const [tenancyResult, maintenanceResult, paymentsResult] = await Promise.all([
    supabase
      .from("tenancies")
      .select(`
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
      `)
      .eq("apartment_id", apartmentId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("maintenance_request")
      .select("id, title, created_at")
      .eq("apartment_id", apartmentId)
      .in("status", ["pending", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payment")
      .select("id, amount, date, status")
      .eq("apartment_id", apartmentId)
      .in("status", ["paid", "partial", "pending"])
      .order("date", { ascending: false })
      .limit(4),
  ]);

  if (tenancyResult.error) throw tenancyResult.error;
  if (maintenanceResult.error) throw maintenanceResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  let tenant: LandlordTenant | null = null;
  const tenancyData = tenancyResult.data as
    | {
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
      }
    | null;

  if (tenancyData?.tenant) {
    const t = tenancyData.tenant;
    tenant = {
      id: t.id,
      fullName: `${t.first_name} ${t.last_name}`,
      email: t.email ?? "—",
      mobileNumber: t.mobile_number,
      avatarUrl: t.avatar_url,
      leaseStart: tenancyData.lease_start,
      leaseEnd: tenancyData.lease_end,
      tenancyId: tenancyData.id,
    };
  }

  const maintData = maintenanceResult.data as
    | { id: string; title: string; created_at: string }
    | null;
  const maintenanceRequest: LandlordTenancyMaintenanceRequest | null = maintData
    ? {
        id: maintData.id,
        title: maintData.title,
        reportedDate: new Date(maintData.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      }
    : null;

  const paymentHistory: PaymentRecord[] = (paymentsResult.data ?? []).map((p) => {
    const d = new Date(p.date);
    return {
      id: p.id,
      month: d.toLocaleString("default", { month: "long" }),
      year: String(d.getFullYear()),
      amount: Number(p.amount ?? 0),
      paidDate: `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`,
      status: p.status as "paid" | "partial" | "pending",
    };
  });

  return { tenant, maintenanceRequest, paymentHistory };
}

// ─── Landlord maintenance requests ────────────────────────────────────────────

const MAINTENANCE_IMAGES_BUCKET = "maintenance-images";

const DB_TO_DISPLAY_STATUS: Record<string, "Pending" | "In Progress" | "Resolved" | "Cancelled"> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
  cancelled: "Cancelled",
};

export type LandlordMaintenanceRequest = {
  id: string;
  issue_title: string;
  description: string;
  apartment_name: string;
  apartment_city: string;
  apartment_address: string;
  tenant_name: string;
  tenant_avatar_url: string | null;
  contact_number: string;
  reported_at: string;
  status: "Pending" | "In Progress" | "Resolved" | "Cancelled";
  urgency: "low" | "medium" | "high";
  photos: string[];
  resolution_notes?: string | null;
};

type LandlordMaintenanceRow = {
  id: string;
  title: string;
  message: string;
  status: string;
  created_at: string;
  urgency: "low" | "medium" | "high";
  image_urls: string[] | null;
  resolution_notes: string | null;
  apartment: {
    name: string | null;
    street_address: string | null;
    barangay: string | null;
    city: string | null;
    province: string | null;
  } | null;
  tenant: {
    first_name: string | null;
    last_name: string | null;
    mobile_number: string | null;
    avatar_url: string | null;
  } | null;
};

export async function fetchLandlordMaintenanceRequests(
  landlordId: string
): Promise<LandlordMaintenanceRequest[]> {
  const { data, error } = await supabase
    .from("maintenance_request")
    .select(
      `
        id,
        title,
        message,
        status,
        created_at,
        urgency,
        image_urls,
        resolution_notes,
        apartment:apartments!maintenance_request_apartment_id_fkey(name, street_address, barangay, city, province),
        tenant:users!maintenance_request_tenant_id_fkey(first_name, last_name, mobile_number, avatar_url)
      `
    )
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as LandlordMaintenanceRow[];
  const imagePaths = rows.flatMap((row) => row.image_urls ?? []);
  const { urls: mediaUrls, error: mediaError } = await resolvePrivateMediaUrls(
    MAINTENANCE_IMAGES_BUCKET,
    imagePaths
  );

  if (mediaError) {
    console.error("Error resolving maintenance media:", mediaError);
  }

  return rows.map((row) => {
    const photos = (row.image_urls ?? [])
      .map((path) => mediaUrls[path])
      .filter((url): url is string => Boolean(url));
    const addressParts = [
      row.apartment?.street_address,
      row.apartment?.barangay,
      row.apartment?.city,
      row.apartment?.province,
    ].filter(Boolean);

    return {
      id: row.id,
      issue_title: row.title,
      description: row.message,
      apartment_name: row.apartment?.name ?? "Unknown apartment",
      apartment_city: row.apartment?.city ?? "",
      apartment_address: addressParts.join(", "),
      tenant_name:
        [row.tenant?.first_name, row.tenant?.last_name]
          .filter(Boolean)
          .join(" ") || "Unknown tenant",
      tenant_avatar_url: row.tenant?.avatar_url ?? null,
      contact_number: row.tenant?.mobile_number ?? "-",
      reported_at: row.created_at,
      status: DB_TO_DISPLAY_STATUS[row.status] ?? "Pending",
      urgency: row.urgency,
      photos,
      resolution_notes: row.resolution_notes ?? null,
    };
  });
}

// ─── Landlord applications ────────────────────────────────────────────────────

type DbStatus = "pending" | "approved" | "rejected" | "cancelled";
export type DisplayStatus = "Applied" | "Approved" | "Rejected" | "Cancelled";

const STATUS_MAP: Record<DbStatus, DisplayStatus> = {
  pending: "Applied",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

function asNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export type LandlordApplication = {
  id: string;
  status: DisplayStatus;
  created_at: string;
  rejected_reason: string | null;
  apartment_id: string;
  tenant_id: string;
  occupation: string;
  employer_name: string;
  monthly_income: number;
  employment_type: string;
  prev_landlord_name: string | null;
  prev_landlord_contact: string | null;
  move_in_date: string;
  no_occupants: number;
  has_pets: boolean;
  has_smoker: boolean;
  need_parking: boolean;
  message: string | null;
  gov_id_url: string | null;
  proof_of_income_url: string | null;
  proof_of_billing_url: string | null;
  nbi_clearance_url: string | null;
  tenant_name: string;
  tenant_avatar_url: string | null;
  tenant_address: string;
  tenant_email: string | null;
  tenant_city: string;
  tenant_mobile_number: string | null;
  apartment_name: string;
  monthly_rent: number;
  apartment_city: string;
  apartment_address: string;
};

export async function fetchLandlordApplications(
  landlordId: string
): Promise<LandlordApplication[]> {
  if (!landlordId) return [];

  const { data, error } = await supabase
    .from("rental_application")
    .select(
      `id, status, created_at, rejected_reason, apartment_id, tenant_id,
      occupation, employer_name, monthly_income, employment_type,
      prev_landlord_name, prev_landlord_contact,
      move_in_date, no_occupants, has_pets, has_smoker, need_parking, message,
      gov_id_url, proof_of_income_url, proof_of_billing_url, nbi_clearance_url,
      apartments!inner(name, monthly_rent, city, street_address, barangay, province, zip_code),
      users!rental_application_tenant_id_fkey(first_name, last_name, avatar_url, street_address, barangay, city, province, postal_code, email, mobile_number)`
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as unknown as Record<string, unknown>[]).map((item) => {
    const tenant = Array.isArray(item.users) ? item.users[0] : item.users;
    const apartment = Array.isArray(item.apartments) ? item.apartments[0] : item.apartments;

    const firstName = (tenant as Record<string, unknown>)?.first_name ?? "";
    const lastName = (tenant as Record<string, unknown>)?.last_name ?? "";
    const tenantName =
      [firstName, lastName].filter(Boolean).join(" ") || "Unknown Tenant";

    return {
      id: item.id as string,
      status: STATUS_MAP[item.status as DbStatus] ?? "Applied",
      created_at: item.created_at as string,
      rejected_reason: (item.rejected_reason as string | null) ?? null,
      apartment_id: item.apartment_id as string,
      tenant_id: item.tenant_id as string,
      occupation: item.occupation as string,
      employer_name: item.employer_name as string,
      monthly_income: Number(item.monthly_income ?? 0),
      employment_type: item.employment_type as string,
      prev_landlord_name: (item.prev_landlord_name as string | null) ?? null,
      prev_landlord_contact: (item.prev_landlord_contact as string | null) ?? null,
      move_in_date: item.move_in_date as string,
      no_occupants: Number(item.no_occupants ?? 0),
      has_pets: Boolean(item.has_pets),
      has_smoker: Boolean(item.has_smoker),
      need_parking: Boolean(item.need_parking),
      message: (item.message as string | null) ?? null,
      gov_id_url: (item.gov_id_url as string | null) ?? null,
      proof_of_income_url: (item.proof_of_income_url as string | null) ?? null,
      proof_of_billing_url: (item.proof_of_billing_url as string | null) ?? null,
      nbi_clearance_url: (item.nbi_clearance_url as string | null) ?? null,
      tenant_name: tenantName,
      tenant_avatar_url: asNullableString(tenant?.avatar_url),
      tenant_address: formatAddress({
        street_address: asNullableString(tenant?.street_address),
        barangay: asNullableString(tenant?.barangay),
        city: asNullableString(tenant?.city),
        province: asNullableString(tenant?.province),
        zip_code: asNullableString(tenant?.postal_code),
      }),
      tenant_email: asNullableString(tenant?.email),
      tenant_mobile_number: asNullableString(tenant?.mobile_number),
      tenant_city: asNullableString(tenant?.city) ?? "",
      apartment_name: asNullableString(apartment?.name) ?? "",
      monthly_rent: Number(asNullableString(apartment?.monthly_rent) ?? 0),
      apartment_city: asNullableString(apartment?.city) ?? "",
      apartment_address: formatAddress({
        street_address: asNullableString(apartment?.street_address),
        barangay: asNullableString(apartment?.barangay),
        city: asNullableString(apartment?.city),
        province: asNullableString(apartment?.province),
        zip_code: asNullableString(apartment?.zip_code),
      }),
    };
  });
}
// ─── Landlord visit requests ──────────────────────────────────────────────────

export type LandlordVisitRequest = {
  id: string;
  visit_date: string;
  time: string;
  no_visitors: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "rescheduled";
  rejected_reason: string | null;
  responded_at: string | null;
  confirmed_visit_date: string | null;
  confirmed_time: string | null;
  created_at: string;
  resolved_visit_date: string;
  resolved_visit_time: string;
  tenant: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    mobile_number: string | null;
  };
  apartment: {
    name: string;
    barangay: string;
    street_address: string;
    city: string;
    province: string;
    zip_code: number | null;
    apartment_images: { url: string }[];
  };
};

type RawApartmentImage = {
  url: string;
  is_cover: boolean | null;
};

// C5-deferred behavior preserved: apartment-image paths are still resolved
// through signed URLs here until the bucket contract is approved.
const signedUrlCache = new Map<string, { signedUrl: string; expiresAt: number }>();
const SIGNED_URL_TTL_MS = 55 * 60 * 1000;

async function resolveApartmentImageUrls(paths: string[]): Promise<Map<string, string>> {
  const uncached: string[] = [];
  const result = new Map<string, string>();

  for (const path of paths) {
    const cached = signedUrlCache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      result.set(path, cached.signedUrl);
    } else {
      uncached.push(path);
    }
  }

  if (uncached.length > 0) {
    const { data } = await supabase.storage
      .from("apartment-images")
      .createSignedUrls(uncached, 60 * 60);

    for (const item of data ?? []) {
      if (item.signedUrl && item.path) {
        signedUrlCache.set(item.path, {
          signedUrl: item.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_TTL_MS,
        });
        result.set(item.path, item.signedUrl);
      }
    }
  }

  return result;
}

export async function fetchLandlordVisitRequests(
  landlordId: string
): Promise<LandlordVisitRequest[]> {
  if (!landlordId) return [];

  const { data, error } = await supabase
    .from("visit_request")
    .select(`
        id,
        visit_date,
        time,
        no_visitors,
        notes,
        status,
        rejected_reason,
        responded_at,
        confirmed_visit_date,
        confirmed_time,
        created_at,
        tenant:users!visit_request_tenant_id_fkey (
          first_name,
          last_name,
          avatar_url,
          mobile_number
        ),
        apartment:apartments!visit_request_apartment_id_fkey (
          name,
          barangay,
          street_address,
          city,
          province,
          zip_code,
          apartment_images (
            url,
            is_cover
          )
        )
      `)
    .eq("landlord_id", landlordId)
    .order("visit_date", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];

  const coverPaths: string[] = [];
  for (const r of rows) {
    const images = (r.apartment?.apartment_images ?? []) as RawApartmentImage[];
    const cover = images.find((img) => img.is_cover === true);
    if (cover?.url) coverPaths.push(cover.url);
  }

  const urlMap = await resolveApartmentImageUrls(coverPaths);

  return rows.map((r) => {
    const images = (r.apartment?.apartment_images ?? []) as RawApartmentImage[];
    const cover = images.find((img) => img.is_cover === true);
    const resolvedUrl = cover?.url ? (urlMap.get(cover.url) ?? cover.url) : null;

    return {
      ...r,
      resolved_visit_date: r.confirmed_visit_date ?? r.visit_date,
      resolved_visit_time: r.confirmed_time ?? r.time,
      apartment: {
        ...r.apartment,
        apartment_images: resolvedUrl ? [{ url: resolvedUrl }] : [],
      },
    } as LandlordVisitRequest;
  });
}

// ─── Manage-apartment description ─────────────────────────────────────────────

export type ManageApartmentDescription = {
  id: string;
  name: string;
  description: string;
  monthly_rent: number;
  security_deposit: number;
  advance_rent: number;
  type: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  no_bedrooms: number;
  no_bathrooms: number;
  area_sqm: number;
  furnished_type: string | null;
  floor_level: string | null;
  max_occupants: number | null;
  lease_duration: string | null;
  amenities: string[];
  lease_agreement_url: string | null;
  landlord: {
    first_name: string;
    last_name: string;
  } | null;
};

export type ManageApartmentActiveTenancy = {
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  tenant: {
    first_name: string;
    last_name: string;
  } | null;
};

export type ManageApartmentDescriptionResult = {
  apartment: ManageApartmentDescription | null;
  tenancy: ManageApartmentActiveTenancy | null;
};

export const getManageApartmentDescriptionQueryKey = (apartmentId: string | undefined) =>
  ["manage-apartment-description", apartmentId] as const;

export async function fetchManageApartmentDescription(
  apartmentId: string
): Promise<ManageApartmentDescriptionResult> {
  const [apartmentResult, tenancyResult] = await Promise.all([
    supabase
      .from("apartments")
      .select(
        `
        id, name, description, monthly_rent, type,
        street_address, barangay, city, province,
        no_bedrooms, no_bathrooms, area_sqm,
        furnished_type, floor_level, max_occupants,
        lease_duration, amenities, lease_agreement_url,
        security_deposit, advance_rent,
        landlord:landlord_id (
          first_name,
          last_name
        )
      `
      )
      .eq("id", apartmentId)
      .single(),
    supabase
      .from("tenancies")
      .select(
        `
        lease_start, lease_end, monthly_rent,
        tenant:users!tenant_id (
          first_name,
          last_name
        )
      `
      )
      .eq("apartment_id", apartmentId)
      .eq("status", "active")
      .maybeSingle(),
  ]);

  if (apartmentResult.error) throw apartmentResult.error;
  if (tenancyResult.error) throw tenancyResult.error;

  return {
    apartment: (apartmentResult.data as ManageApartmentDescription | null) ?? null,
    tenancy: (tenancyResult.data as ManageApartmentActiveTenancy | null) ?? null,
  };
}

// ─── Landlord stats ───────────────────────────────────────────────────────────

export type LandlordStats = {
  averageRating: number;
  totalProperties: number;
};

export async function fetchLandlordStats(landlordId: string): Promise<LandlordStats> {
  const { data, error } = await supabase
    .from("apartments")
    .select("average_rating.avg(), count()")
    .eq("landlord_id", landlordId)
    .is("deleted_at", null);

  if (error) throw error;

  const row = data?.[0] as { avg?: number | null; count?: number } | null;

  const totalProperties = row?.count ?? 0;
  const averageRating =
    typeof row?.avg === "number" && !Number.isNaN(row.avg)
      ? Math.round(row.avg * 10) / 10
      : 0;

  return { averageRating, totalProperties };
}

// ─── Landlord maintenance status updates ──────────────────────────────────────

export const DISPLAY_TO_DB_STATUS: Record<MaintenanceRequestStatus, string> = {
  Pending: "pending",
  "In Progress": "in_progress",
  Resolved: "resolved",
  Cancelled: "cancelled",
};

export async function updateLandlordMaintenanceStatus(
  id: string,
  nextStatus: MaintenanceRequestStatus,
  resolutionNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const updatePayload: Record<string, unknown> = {
    status: DISPLAY_TO_DB_STATUS[nextStatus],
  };
  if (nextStatus === "Resolved") {
    updatePayload.resolved_at = new Date().toISOString();
    updatePayload.resolution_notes = resolutionNotes?.trim() || null;
  }
  if (nextStatus === "Cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
  }

  const { error, data } = await supabase
    .from("maintenance_request")
    .update(updatePayload)
    .eq("id", id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { success: false, error: error?.message ?? "Could not update request status." };
  }

  return { success: true };
}

// ─── Landlord payment history + status updates ────────────────────────────────

export type LandlordPaymentRecord = {
  id: string;
  created_at: string;
  date: string;
  amount: number | null;
  status: string;
  method: string | null;
  reference_id: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  tenant_name: string | null;
};

export async function fetchLandlordPayments(apartmentId: string): Promise<LandlordPaymentRecord[]> {
  const { data, error } = await supabase
    .from("payment")
    .select(
      `
        id,
        created_at,
        date,
        amount,
        status,
        method,
        reference_id,
        period_start,
        period_end,
        due_date,
        tenant:users!payment_tenant_id_fkey (first_name, last_name)
      `
    )
    .eq("apartment_id", apartmentId)
    .order("period_start", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const p = row as {
      id: string;
      created_at: string;
      date: string;
      amount: number | null;
      status: string;
      method: string | null;
      reference_id: string | null;
      period_start: string | null;
      period_end: string | null;
      due_date: string | null;
      tenant: { first_name: string | null; last_name: string | null } | null;
    };
    const tenant = p.tenant;
    return {
      id: p.id,
      created_at: p.created_at,
      date: p.date,
      amount: p.amount,
      status: p.status,
      method: p.method,
      reference_id: p.reference_id,
      period_start: p.period_start,
      period_end: p.period_end,
      due_date: p.due_date,
      tenant_name:
        tenant?.first_name || tenant?.last_name
          ? `${tenant.first_name ?? ""} ${tenant.last_name ?? ""}`.trim()
          : null,
    };
  });
}

// Only cash rows awaiting landlord confirmation are flippable by hand; the
// webhook owns e-wallet/card rows. RLS (landlord_update_payment_status) and the
// status column grant already gate this server-side.
export async function updateLandlordPaymentStatus(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const { error, data } = await supabase
    .from("payment")
    .update({ status: "paid" })
    .eq("id", id)
    .eq("method", "cash")
    .eq("status", "pending")
    .select("id");

  if (error || !data || data.length === 0) {
    return { success: false, error: error?.message ?? "Could not update payment status." };
  }

  return { success: true };
}

// ─── Tenant applications (own applications sent by the signed-in tenant) ──────
