import { notFound } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../_lib/require-admin";
import UserProfileHeader from "./components/UserProfileHeader";
import UserPersonalInfo from "./components/UserPersonalInfo";
import UserVerificationCard from "./components/UserVerificationCard";
import UserRentalActivity, {
  type ActiveTenancy,
  type OwnedApartment,
  type PipelineApplication,
  type PipelineVisit,
} from "./components/UserRentalActivity";
import type { UserVerificationItem } from "./components/UserVerificationCard";
import UserTrustSafety from "./components/UserTrustSafety";
import UserReputation, { type UserReview } from "./components/UserReputation";
import UserPayments, { type UserPayment } from "./components/UserPayments";
import UserMaintenance, {
  type MaintenanceBreakdown,
  type UserMaintenanceItem,
} from "./components/UserMaintenance";
import UserActivityTimeline, {
  type UserActivityEvent,
} from "./components/UserActivityTimeline";
import type { AdminUserDetail } from "../lib/user-display";

interface ApartmentRef {
  name: string;
}

function apartmentName(
  value: ApartmentRef | ApartmentRef[] | null | undefined,
  fallback: string,
): string {
  if (!value) return fallback;
  if (Array.isArray(value)) return value[0]?.name ?? fallback;
  return value.name ?? fallback;
}

function personName(
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null,
): string | null {
  if (!profile) return null;
  return (
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    profile.email
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  // Live `public.users` has no phase-2 suspension columns
  // (`20260926143751_phase2_admin_operations.sql` not applied), so the gating
  // select only uses columns confirmed to exist. Suspension fields load
  // best-effort afterwards and degrade to "Active" when absent.
  const USER_BASE_COLUMNS =
    "id, first_name, middle_name, last_name, suffix, email, mobile_number, gender, birth_date, street_address, barangay, city, province, postal_code, avatar_url, background_url, roles, account_status, created_at, updated_at";

  const [
    { data: userData, error: userError },
    { data: verificationsData },
    { data: apartmentsData },
    { data: tenantTenanciesData },
    { data: landlordTenanciesData },
    { data: applicationsData },
    { data: applicationStatusesData },
    { data: visitsData },
    { data: visitStatusesData },
    { data: reviewsData },
    { data: ratingsData },
    { data: paymentsData },
    { data: paymentTotalsData },
    { data: maintenanceData },
    { data: maintenanceStatusesData },
    { count: paymentCount },
  ] = await Promise.all([
    supabase.from("users").select(USER_BASE_COLUMNS).eq("id", id).single(),
    supabase
      .from("user_verifications")
      .select(
        "id, id_type, status, submitted_at, reviewed_at, rejection_reason, reviewed_by",
      )
      .eq("user_id", id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabase
      .from("apartments")
      .select(
        "id, name, monthly_rent, city, status, is_verified, is_hidden_by_admin",
      )
      .eq("landlord_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("tenancies")
      .select(
        "id, status, lease_start, lease_end, monthly_rent, apartment_id, apartment:apartments!tenancies_apartment_id_fkey(name)",
      )
      .eq("tenant_id", id)
      .order("lease_start", { ascending: false })
      .limit(10),
    supabase
      .from("tenancies")
      .select(
        "id, status, lease_start, lease_end, monthly_rent, apartment_id, apartment:apartments!tenancies_apartment_id_fkey(name), tenant:users!tenancies_tenant_id_fkey(first_name,last_name)",
      )
      .eq("landlord_id", id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(10),
    supabase
      .from("rental_application")
      .select(
        "id, status, created_at, apartment:apartments!rental_application_apartment_id_fkey(name)",
      )
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("rental_application")
      .select("status")
      .eq("tenant_id", id)
      .limit(100),
    supabase
      .from("visit_request")
      .select(
        "id, status, visit_date, apartment:apartments!visit_request_apartment_id_fkey(name)",
      )
      .eq("tenant_id", id)
      .order("visit_date", { ascending: false })
      .limit(5),
    supabase
      .from("visit_request")
      .select("status")
      .eq("tenant_id", id)
      .limit(100),
    supabase
      .from("reviews")
      .select(
        "id, rating, comment, created_at, apartment:apartments!reviews_apartment_id_fkey(name)",
      )
      .eq("tenant_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("reviews").select("rating").eq("tenant_id", id).limit(100),
    supabase
      .from("payment")
      .select(
        "id, amount, status, method, date, apartment:apartments!payment_apartment_id_fkey(name)",
      )
      .eq("tenant_id", id)
      .order("date", { ascending: false })
      .limit(5),
    supabase
      .from("payment")
      .select("amount, status")
      .eq("tenant_id", id)
      .limit(50),
    supabase
      .from("maintenance_request")
      .select(
        "id, title, status, created_at, apartment:apartments!maintenance_request_apartment_id_fkey(name)",
      )
      .or(`tenant_id.eq.${id},landlord_id.eq.${id}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("maintenance_request")
      .select("status")
      .or(`tenant_id.eq.${id},landlord_id.eq.${id}`)
      .limit(100),
    supabase
      .from("payment")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", id),
  ]);

  type UserBase = Omit<
    AdminUserDetail,
    "is_suspended" | "suspension_reason" | "suspended_at" | "suspended_by"
  >;
  const userBase = userData as unknown as UserBase | null;
  if (!userBase) {
    if (userError) console.error("Admin user detail lookup failed", userError);
    notFound();
  }

  // Best-effort suspension fields: present only where the phase-2 admin
  // operations migration has been applied. A missing column must not 404.
  let suspensionSupported = false;
  let suspension: Pick<
    AdminUserDetail,
    "is_suspended" | "suspension_reason" | "suspended_at" | "suspended_by"
  > = {
    is_suspended: false,
    suspension_reason: null,
    suspended_at: null,
    suspended_by: null,
  };
  const { data: suspensionData, error: suspensionError } = await supabase
    .from("users")
    .select("is_suspended, suspension_reason, suspended_at, suspended_by")
    .eq("id", id)
    .single();
  if (!suspensionError && suspensionData) {
    const row = suspensionData as unknown as typeof suspension;
    suspension = {
      is_suspended: row.is_suspended ?? false,
      suspension_reason: row.suspension_reason ?? null,
      suspended_at: row.suspended_at ?? null,
      suspended_by: row.suspended_by ?? null,
    };
    suspensionSupported = true;
  }

  const user: AdminUserDetail = { ...userBase, ...suspension };
  const roles = Array.isArray(user.roles) ? user.roles : [];

  const verifications = (verificationsData ?? []) as unknown as Array<{
    id: string;
    id_type: string;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
    reviewed_by: string | null;
  }>;

  const verificationIds = verifications.map((item) => item.id);
  const reviewerIds = [
    ...new Set(
      [
        ...verifications.map((item) => item.reviewed_by),
        ...(suspensionSupported ? [user.suspended_by] : []),
      ].filter((value): value is string => Boolean(value)),
    ),
  ];
  const activityFilter =
    `and(target_type.eq.user,target_id.eq.${id})` +
    verificationIds
      .map(
        (item) => `,and(target_type.eq.user_verification,target_id.eq.${item})`,
      )
      .join("");
  const [
    { data: reviewersData },
    { data: activityData },
    { count: favoritesCount },
    { count: maintenanceCount },
  ] = await Promise.all([
    reviewerIds.length
      ? supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in("id", reviewerIds)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase
      .from("admin_audit_logs")
      .select(
        "id, action, target_type, target_id, reason, created_at, admin:users!admin_audit_logs_admin_id_fkey(first_name,last_name,email)",
      )
      .or(activityFilter)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", id),
    supabase
      .from("maintenance_request")
      .select("id", { count: "exact", head: true })
      .or(`tenant_id.eq.${id},landlord_id.eq.${id}`),
  ]);
  let reviewerNames = new Map<string, string>();
  if (reviewerIds.length) {
    reviewerNames = new Map(
      (
        (reviewersData ?? []) as unknown as Array<{
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
        }>
      ).map((profile) => [profile.id, personName(profile) ?? "Administrator"]),
    );
  }

  const verificationItems: UserVerificationItem[] = verifications.map(
    (item) => ({
      id: item.id,
      id_type: item.id_type,
      status: item.status,
      submitted_at: item.submitted_at,
      reviewed_at: item.reviewed_at,
      rejection_reason: item.rejection_reason,
      reviewer_name: item.reviewed_by
        ? (reviewerNames.get(item.reviewed_by) ?? null)
        : null,
    }),
  );

  const apartments = (
    (apartmentsData ?? []) as unknown as OwnedApartment[]
  ).slice(0, 20);
  const apartmentThumbnails = new Map<string, string>();
  if (apartments.length) {
    const { data: covers } = await supabase
      .from("apartment_images")
      .select("apartment_id, url, url_thumb")
      .in(
        "apartment_id",
        apartments.map((apartment) => apartment.id),
      )
      .eq("is_cover", true);
    for (const cover of covers ?? []) {
      if (cover.apartment_id && !apartmentThumbnails.has(cover.apartment_id)) {
        apartmentThumbnails.set(cover.apartment_id, cover.url_thumb ?? cover.url);
      }
    }
  }
  const apartmentsWithThumbnails = apartments.map((apartment) => ({
    ...apartment,
    thumbnail_url: apartmentThumbnails.get(apartment.id) ?? null,
  }));

  type TenancyRow = {
    id: string;
    status: string;
    lease_start: string;
    lease_end: string | null;
    monthly_rent: number | null;
    apartment_id: string;
    apartment: ApartmentRef | ApartmentRef[] | null;
    tenant?: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  };
  function tenantDisplayName(row: TenancyRow): string | null {
    if (!row.tenant) return null;
    return (
      `${row.tenant.first_name ?? ""} ${row.tenant.last_name ?? ""}`.trim() ||
      null
    );
  }
  function toActiveTenancy(
    row: TenancyRow,
    counterparty_role: "tenant" | "landlord",
  ): ActiveTenancy {
    return {
      id: row.id,
      status: row.status,
      lease_start: row.lease_start,
      lease_end: row.lease_end,
      monthly_rent: row.monthly_rent,
      apartment_id: row.apartment_id,
      apartment_name: apartmentName(row.apartment, "Apartment"),
      counterparty_role,
      tenant_name: tenantDisplayName(row),
    };
  }
  const tenanciesAsTenant = (
    (tenantTenanciesData ?? []) as unknown as TenancyRow[]
  ).map((row) => toActiveTenancy(row, "tenant"));
  const tenanciesAsLandlord = (
    (landlordTenanciesData ?? []) as unknown as TenancyRow[]
  ).map((row) => toActiveTenancy(row, "landlord"));

  type ApplicationRow = {
    id: string;
    status: string;
    created_at: string;
    apartment: ApartmentRef | ApartmentRef[] | null;
  };
  const applications: PipelineApplication[] = (
    (applicationsData ?? []) as unknown as ApplicationRow[]
  ).map((row) => ({
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    apartment_name: apartmentName(row.apartment, "Apartment"),
  }));
  const applicationTotal = (applicationStatusesData ?? []).length;
  const visitTotal = (visitStatusesData ?? []).length;

  type VisitRow = {
    id: string;
    status: string;
    visit_date: string;
    apartment: ApartmentRef | ApartmentRef[] | null;
  };
  const visits: PipelineVisit[] = (
    (visitsData ?? []) as unknown as VisitRow[]
  ).map((row) => ({
    id: row.id,
    status: row.status,
    visit_date: row.visit_date,
    apartment_name: apartmentName(row.apartment, "Apartment"),
  }));

  type ReviewRow = {
    id: string;
    rating: number;
    comment: string | null;
    created_at: string | null;
    apartment: ApartmentRef | ApartmentRef[] | null;
  };
  const reviews: UserReview[] = (
    (reviewsData ?? []) as unknown as ReviewRow[]
  ).map((row) => ({
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    created_at: row.created_at,
    apartment_name: apartmentName(row.apartment, "Apartment"),
  }));
  const allRatings = (
    (ratingsData ?? []) as unknown as Array<{ rating: number }>
  ).map((row) => row.rating);
  const averageRating = allRatings.length
    ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
    : null;

  type PaymentRow = {
    id: string;
    amount: number | null;
    status: string;
    method: string;
    date: string;
    apartment: ApartmentRef | ApartmentRef[] | null;
  };
  const payments: UserPayment[] = (
    (paymentsData ?? []) as unknown as PaymentRow[]
  ).map((row) => ({
    id: row.id,
    amount: row.amount,
    status: row.status,
    method: row.method,
    date: row.date,
    apartment_name: apartmentName(row.apartment, "Apartment"),
  }));
  const paymentTotals = (
    (paymentTotalsData ?? []) as unknown as Array<{
      amount: number | null;
      status: string;
    }>
  ).reduce(
    (totals, row) => ({
      paidTotal:
        totals.paidTotal + (row.status === "paid" ? (row.amount ?? 0) : 0),
    }),
    { paidTotal: 0 },
  );
  const transactionCount = paymentCount ?? payments.length;

  type MaintenanceRow = {
    id: string;
    title: string;
    status: string;
    created_at: string;
    apartment: ApartmentRef | ApartmentRef[] | null;
  };
  const maintenanceItems: UserMaintenanceItem[] = (
    (maintenanceData ?? []) as unknown as MaintenanceRow[]
  ).map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    created_at: row.created_at,
    apartment_name: apartmentName(row.apartment, "Apartment"),
  }));
  const maintenanceBreakdown: MaintenanceBreakdown = (
    (maintenanceStatusesData ?? []) as unknown as Array<{ status: string }>
  )
    .map((row) => row.status)
    .reduce<MaintenanceBreakdown>(
      (totals, status) => ({
        total: totals.total + 1,
        pending: totals.pending + (status === "pending" ? 1 : 0),
        active: totals.active + (status === "in_progress" ? 1 : 0),
        resolved: totals.resolved + (status === "resolved" ? 1 : 0),
      }),
      { total: 0, pending: 0, active: 0, resolved: 0 },
    );

  type ActivityRow = {
    id: string;
    action: string;
    target_type: string;
    target_id: string;
    reason: string | null;
    created_at: string;
    admin: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    } | null;
  };
  const activityEvents: UserActivityEvent[] = (
    (activityData ?? []) as unknown as ActivityRow[]
  ).map((event) => ({
    id: event.id,
    action: event.action,
    target_type: event.target_type,
    target_id: event.target_id,
    reason: event.reason,
    created_at: event.created_at,
    admin_name: personName(event.admin) ?? "Administrator",
  }));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-3">
          <UserProfileHeader
            user={{ ...user, roles }}
            suspensionSupported={suspensionSupported}
          />
          <UserPersonalInfo user={{ ...user, roles }} />
          <UserRentalActivity
            roles={roles}
          apartments={apartmentsWithThumbnails}
            tenanciesAsTenant={tenanciesAsTenant}
            tenanciesAsLandlord={tenanciesAsLandlord}
            applications={applications}
            applicationTotal={applicationTotal}
            visits={visits}
            visitTotal={visitTotal}
          />
          <UserPayments
            payments={payments}
            paidTotal={paymentTotals.paidTotal}
            transactionCount={transactionCount}
          />
          <UserMaintenance
            items={maintenanceItems}
            breakdown={{
              ...maintenanceBreakdown,
              total: maintenanceCount ?? maintenanceBreakdown.total,
            }}
          />
          <UserActivityTimeline events={activityEvents} />
        </div>
        <div className="grid min-w-0 grid-cols-1 content-start gap-3">
          <UserVerificationCard
            accountStatus={user.account_status}
            verifications={verificationItems}
          />
          <UserTrustSafety
            user={{ ...user, roles }}
            suspendedByName={
              user.suspended_by
                ? (reviewerNames.get(user.suspended_by) ?? null)
                : null
            }
            verificationAttempts={verifications.length}
            suspensionSupported={suspensionSupported}
          />
          <UserReputation
            reviews={reviews}
            averageRating={averageRating}
            totalReviews={allRatings.length}
            favoritesCount={favoritesCount ?? 0}
            showFavorites={roles.includes("tenant")}
          />
        </div>
      </div>
    </div>
  );
}
