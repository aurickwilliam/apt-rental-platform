import { createClient } from "@repo/supabase/server";

export interface VerificationRequest {
  id: string;
  kind: "users" | "apartments";
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
  trends: TrendPoint[];
  hasError: boolean;
  chartsError: boolean;
}

const QUEUE_LIMIT = 8;
const RECENT_LIMIT = 5;
const TREND_BUCKETS = 6;
const DAY_MS = 86_400_000;

function dateTime(date: Date): string {
  return `${date.toISOString().slice(0, 10)}T00:00:00+08:00`;
}

function fullName(
  profile:
    | {
        first_name: string | null;
        last_name: string | null;
        email?: string | null;
      }
    | undefined,
  fallback: string,
): string {
  return (
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
    profile?.email ||
    fallback
  );
}

export async function getDashboardData(
  from: string,
  to: string,
): Promise<DashboardData> {
  const supabase = await createClient();
  const [
    users,
    apartments,
    pendingUsers,
    pendingApartments,
    userQueue,
    apartmentQueue,
    recentUsers,
    recentApartments,
    recentActivity,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("user_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("apartment_verifications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("user_verifications")
      .select("id, user_id, submitted_at")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false })
      .limit(QUEUE_LIMIT),
    supabase
      .from("apartment_verifications")
      .select("id, apartment_id, landlord_id, submitted_at")
      .eq("status", "pending")
      .order("submitted_at", { ascending: false })
      .limit(QUEUE_LIMIT),
    supabase
      .from("users")
      .select("id, first_name, last_name, email, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("apartments")
      .select("id, name, city, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase
      .from("admin_audit_logs")
      .select("id, admin_id, action, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  const userIds = [
    ...new Set(
      (userQueue.data ?? [])
        .map((row) => row.user_id)
        .concat(
          (apartmentQueue.data ?? []).map((row) => row.landlord_id),
          (recentActivity.data ?? []).map((row) => row.admin_id),
        ),
    ),
  ];
  const apartmentIds = [
    ...new Set(
      (apartmentQueue.data ?? [])
        .map((row) => row.apartment_id)
        .concat((recentApartments.data ?? []).map((row) => row.id)),
    ),
  ];
  const [profiles, queueApartments, images] = await Promise.all([
    userIds.length
      ? supabase
          .from("users")
          .select("id, first_name, last_name, email, avatar_url")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    apartmentIds.length
      ? supabase
          .from("apartments")
          .select("id, name, city")
          .in("id", apartmentIds)
      : Promise.resolve({ data: [], error: null }),
    apartmentIds.length
      ? supabase
          .from("apartment_images")
          .select("apartment_id, url, url_thumb, is_cover")
          .in("apartment_id", apartmentIds)
          .order("is_cover", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const profilesById = new Map(
    (profiles.data ?? []).map((profile) => [profile.id, profile]),
  );
  const apartmentsById = new Map(
    (queueApartments.data ?? []).map((apartment) => [apartment.id, apartment]),
  );
  const imageByApartment = new Map<string, string>();
  for (const image of images.data ?? []) {
    if (image.apartment_id && !imageByApartment.has(image.apartment_id)) {
      imageByApartment.set(image.apartment_id, image.url_thumb || image.url);
    }
  }

  const queue: VerificationRequest[] = [
    ...(userQueue.data ?? []).map((row) => {
      const profile = profilesById.get(row.user_id);
      return {
        id: row.id,
        kind: "users" as const,
        name: fullName(profile, "Unknown applicant"),
        detail: profile?.email ?? "Account verification",
        submittedAt: row.submitted_at,
        image: profile?.avatar_url ?? null,
      };
    }),
    ...(apartmentQueue.data ?? []).map((row) => {
      const apartment = apartmentsById.get(row.apartment_id);
      return {
        id: row.id,
        kind: "apartments" as const,
        name: apartment?.name ?? "Unknown apartment",
        detail: fullName(profilesById.get(row.landlord_id), "Unknown landlord"),
        submittedAt: row.submitted_at,
        image: imageByApartment.get(row.apartment_id) ?? null,
      };
    }),
  ].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  const dayCount = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const bucketCount = Math.min(TREND_BUCKETS, dayCount);
  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const first = new Date(
      start.getTime() + Math.floor((index * dayCount) / bucketCount) * DAY_MS,
    );
    const next = new Date(
      start.getTime() +
        Math.floor(((index + 1) * dayCount) / bucketCount) * DAY_MS,
    );
    return {
      first,
      next,
      label: new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(first),
    };
  });

  const chartResults = await Promise.all(
    buckets.map(async ({ first, next, label }) => {
      const lower = dateTime(first);
      const upper = dateTime(next);
      const [newUsers, newApartments, reviewedUsers, reviewedApartments] =
        await Promise.all([
          supabase
            .from("users")
            .select("id", { count: "exact", head: true })
            .gte("created_at", lower)
            .lt("created_at", upper),
          supabase
            .from("apartments")
            .select("id", { count: "exact", head: true })
            .gte("created_at", lower)
            .lt("created_at", upper),
          supabase
            .from("user_verifications")
            .select("id", { count: "exact", head: true })
            .in("status", ["approved", "rejected"])
            .gte("reviewed_at", lower)
            .lt("reviewed_at", upper),
          supabase
            .from("apartment_verifications")
            .select("id", { count: "exact", head: true })
            .in("status", ["approved", "rejected"])
            .gte("reviewed_at", lower)
            .lt("reviewed_at", upper),
        ]);
      return {
        label,
        users: newUsers.count ?? 0,
        apartments: newApartments.count ?? 0,
        reviews: (reviewedUsers.count ?? 0) + (reviewedApartments.count ?? 0),
        error: [
          newUsers,
          newApartments,
          reviewedUsers,
          reviewedApartments,
        ].some((result) => Boolean(result.error)),
      };
    }),
  );

  const hasError = [
    users,
    apartments,
    pendingUsers,
    pendingApartments,
    userQueue,
    apartmentQueue,
    recentUsers,
    recentApartments,
    recentActivity,
    profiles,
    queueApartments,
    images,
  ].some((result) => Boolean(result.error));
  const chartsError = chartResults.some((result) => result.error);
  if (hasError || chartsError)
    console.error("Admin dashboard: some queries failed");

  return {
    totals: {
      users: users.count,
      apartments: apartments.count,
      pendingUsers: pendingUsers.count,
      pendingApartments: pendingApartments.count,
    },
    queue,
    recentUsers: (recentUsers.data ?? []).map((row) => ({
      id: row.id,
      href: `/admin/users/${row.id}`,
      name: fullName(row, "Unnamed user"),
      detail: row.email ?? "No email provided",
      image: row.avatar_url,
      date: row.created_at,
    })),
    recentApartments: (recentApartments.data ?? []).map((row) => ({
      id: row.id,
      href: `/admin/apartments/${row.id}`,
      name: row.name,
      detail: row.city ?? "Location unavailable",
      image: imageByApartment.get(row.id) ?? null,
      date: row.created_at,
    })),
    recentActivity: (recentActivity.data ?? []).map((row) => ({
      id: row.id,
      href: "/admin/activity",
      name: row.action.replaceAll("_", " "),
      detail: fullName(profilesById.get(row.admin_id), "Administrator"),
      image: null,
      date: row.created_at,
    })),
    trends: chartsError
      ? []
      : chartResults.map(({ label, users, apartments, reviews }) => ({
          label,
          users,
          apartments,
          reviews,
        })),
    hasError,
    chartsError,
  };
}
