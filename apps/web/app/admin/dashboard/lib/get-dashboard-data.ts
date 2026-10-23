import { createClient } from "@repo/supabase/server";

export interface VerificationRequest {
  id: string;
  kind: "users" | "apartments";
  role: string | null;
  name: string;
  detail: string;
  submittedAt: string;
  image: string | null;
}

export interface RecentItem {
  id: string;
  href: string;
  name: string;
  detail: string;
  image: string | null;
  date: string;
}

interface ProfileWithRoles {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  roles: string[];
}

export interface TrendPoint {
  label: string;
  users: number;
  apartments: number;
  reviews: number;
}

export interface DashboardData {
  totals: {
    users: number | null;
    apartments: number | null;
    pendingUsers: number | null;
    pendingApartments: number | null;
  };
  queue: VerificationRequest[];
  recentUsers: RecentItem[];
  recentApartments: RecentItem[];
  recentActivity: RecentItem[];
  hasError: boolean;
}

export interface DashboardRegion<T> {
  data: T;
  hasError: boolean;
}

const QUEUE_LIMIT = 8;
const RECENT_LIMIT = 5;
const EMPTY_TOTALS: DashboardData["totals"] = {
  users: null, apartments: null, pendingUsers: null, pendingApartments: null,
};

function fullName(
  profile: { first_name: string | null; last_name: string | null; email?: string | null } | undefined,
  fallback: string,
): string {
  return `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || profile?.email || fallback;
}

function region<T>(pending: Promise<DashboardRegion<T>>, fallback: T): Promise<DashboardRegion<T>> {
  // Observe every rejection immediately, even if its Suspense region is later.
  return pending.then((result) => {
    if (result.hasError) console.error("Admin dashboard: some queries failed");
    return result;
  }, () => {
    console.error("Admin dashboard: region could not be loaded");
    return { data: fallback, hasError: true };
  });
}

/** Start the same nine reads and three shared enrichment reads, without a
 * whole-dashboard barrier. Called only after the page's existing admin guard.
 * Shared promises are request-local, never cross-request private-data caches.
 */
export async function getDashboardRegions() {
  const supabase = await createClient();
  const users = Promise.resolve(
    supabase.from("users").select("id", { count: "exact", head: true }),
  );
  const apartments = Promise.resolve(
    supabase.from("apartments").select("id", { count: "exact", head: true }).is("deleted_at", null),
  );
  const pendingUsers = Promise.resolve(
    supabase.from("user_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  );
  const pendingApartments = Promise.resolve(
    supabase.from("apartment_verifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  );
  const userQueue = Promise.resolve(
    supabase.from("user_verifications").select("id, user_id, submitted_at")
      .eq("status", "pending").order("submitted_at", { ascending: false }).limit(QUEUE_LIMIT),
  );
  const apartmentQueue = Promise.resolve(
    supabase.from("apartment_verifications").select("id, apartment_id, landlord_id, submitted_at")
      .eq("status", "pending").order("submitted_at", { ascending: false }).limit(QUEUE_LIMIT),
  );
  const recentUsers = Promise.resolve(
    supabase.from("users").select("id, first_name, last_name, email, avatar_url, created_at")
      .order("created_at", { ascending: false }).limit(RECENT_LIMIT),
  );
  const recentApartments = Promise.resolve(
    supabase.from("apartments").select("id, name, city, created_at")
      .is("deleted_at", null).order("created_at", { ascending: false }).limit(RECENT_LIMIT),
  );
  const recentActivity = Promise.resolve(
    supabase.from("admin_audit_logs").select("id, admin_id, action, created_at")
      .order("created_at", { ascending: false }).limit(RECENT_LIMIT),
  );

  const profiles = Promise.all([userQueue, apartmentQueue, recentActivity]).then(async ([userRows, apartmentRows, activityRows]) => {
    const ids = [...new Set((userRows.data ?? []).map((row) => row.user_id).concat(
      (apartmentRows.data ?? []).map((row) => row.landlord_id),
      (activityRows.data ?? []).map((row) => row.admin_id),
    ))];
    return ids.length
      ? await supabase.from("users").select("id, first_name, last_name, email, avatar_url, roles").in("id", ids)
      : { data: [], error: null };
  });
  const apartmentIds = Promise.all([apartmentQueue, recentApartments]).then(([queueRows, recentRows]) =>
    [...new Set((queueRows.data ?? []).map((row) => row.apartment_id).concat((recentRows.data ?? []).map((row) => row.id)))],
  );
  const queueApartments = apartmentIds.then(async (ids) => ids.length
    ? await supabase.from("apartments").select("id, name, city").in("id", ids)
    : { data: [], error: null });
  const images = apartmentIds.then(async (ids) => ids.length
    ? await supabase.from("apartment_images").select("apartment_id, url, url_thumb, is_cover").in("apartment_id", ids).order("is_cover", { ascending: false }).limit(100)
    : { data: [], error: null });

  const totals = region(Promise.all([users, apartments, pendingUsers, pendingApartments]).then((rows) => ({
    data: { users: rows[0].count, apartments: rows[1].count, pendingUsers: rows[2].count, pendingApartments: rows[3].count },
    hasError: rows.some((row) => Boolean(row.error)),
  })), EMPTY_TOTALS);

  const queue = region<VerificationRequest[]>(Promise.all([userQueue, apartmentQueue, profiles, queueApartments, images]).then(([userRows, apartmentRows, profileRows, apartmentDetails, imageRows]) => {
    const profilesById = new Map(((profileRows.data ?? []) as unknown as ProfileWithRoles[]).map((profile) => [profile.id, profile]));
    const apartmentsById = new Map((apartmentDetails.data ?? []).map((apartment) => [apartment.id, apartment]));
    const imageByApartment = imageMap(imageRows.data ?? []);
    return {
      data: [
        ...(userRows.data ?? []).map((row): VerificationRequest => {
          const profile = profilesById.get(row.user_id);
          return {
            id: row.id, kind: "users", role: profile?.roles.join(", ") ?? null,
            name: fullName(profile, "Unknown applicant"), detail: profile?.email ?? "Account verification",
            submittedAt: row.submitted_at, image: profile?.avatar_url ?? null,
          };
        }),
        ...(apartmentRows.data ?? []).map((row): VerificationRequest => {
          const apartment = apartmentsById.get(row.apartment_id);
          const landlord = profilesById.get(row.landlord_id);
          return {
            id: row.id, kind: "apartments", role: landlord?.roles.join(", ") ?? null,
            name: apartment?.name ?? "Unknown apartment", detail: fullName(landlord, "Unknown landlord"),
            submittedAt: row.submitted_at, image: imageByApartment.get(row.apartment_id) ?? null,
          };
        }),
      ].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
      hasError: [userRows, apartmentRows, profileRows, apartmentDetails, imageRows].some((row) => Boolean(row.error)),
    };
  }), []);

  const usersRegion = region<RecentItem[]>(recentUsers.then((rows) => ({
    data: (rows.data ?? []).map((row) => ({ id: row.id, href: `/admin/users/${row.id}`, name: fullName(row, "Unnamed user"), detail: row.email ?? "No email provided", image: row.avatar_url, date: row.created_at })),
    hasError: Boolean(rows.error),
  })), []);
  const apartmentsRegion = region<RecentItem[]>(Promise.all([recentApartments, images]).then(([rows, imageRows]) => {
    const imageByApartment = imageMap(imageRows.data ?? []);
    return {
      data: (rows.data ?? []).map((row) => ({ id: row.id, href: `/admin/apartments/${row.id}`, name: row.name, detail: row.city ?? "Location unavailable", image: imageByApartment.get(row.id) ?? null, date: row.created_at })),
      hasError: Boolean(rows.error || imageRows.error),
    };
  }), []);
  const activityRegion = region<RecentItem[]>(Promise.all([recentActivity, profiles]).then(([rows, profileRows]) => {
    const profilesById = new Map(((profileRows.data ?? []) as unknown as ProfileWithRoles[]).map((profile) => [profile.id, profile]));
    return {
      data: (rows.data ?? []).map((row) => ({ id: row.id, href: "/admin/activity", name: row.action.replaceAll("_", " "), detail: fullName(profilesById.get(row.admin_id), "Administrator"), image: null, date: row.created_at })),
      hasError: Boolean(rows.error || profileRows.error),
    };
  }), []);

  return { totals, queue, recentUsers: usersRegion, recentApartments: apartmentsRegion, recentActivity: activityRegion };
}

function imageMap(images: { apartment_id: string | null; url: string; url_thumb: string | null }[]) {
  const result = new Map<string, string>();
  for (const image of images) {
    if (image.apartment_id && !result.has(image.apartment_id)) result.set(image.apartment_id, image.url_thumb || image.url);
  }
  return result;
}

/** Compatibility for consumers that genuinely need the whole snapshot. */
export async function getDashboardData(): Promise<DashboardData> {
  const regions = await getDashboardRegions();
  const [totals, queue, recentUsers, recentApartments, recentActivity] = await Promise.all([
    regions.totals, regions.queue, regions.recentUsers, regions.recentApartments, regions.recentActivity,
  ]);
  return {
    totals: totals.data, queue: queue.data, recentUsers: recentUsers.data, recentApartments: recentApartments.data, recentActivity: recentActivity.data,
    hasError: [totals, queue, recentUsers, recentApartments, recentActivity].some((result) => result.hasError),
  };
}

export async function getDashboardTrends(from: string, to: string): Promise<{
  trends: TrendPoint[];
  error: boolean;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_dashboard_trends", {
    p_from: from,
    p_to: to,
  });
  if (error) console.error("Admin dashboard trends failed", error);
  return { trends: data ?? [], error: Boolean(error) };
}
