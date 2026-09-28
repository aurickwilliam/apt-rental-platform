import { notFound } from "next/navigation";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../_lib/require-admin";
import { ApartmentOverview } from "./components/ApartmentOverview";
import {
  ApartmentLandlordCard,
  ApartmentListingControls,
  ApartmentVerificationCard,
} from "./components/ApartmentSidebar";
import {
  ApartmentActivityTimeline,
  ApartmentMaintenanceSummary,
  ApartmentPipelineSummary,
  ApartmentReviewsSummary,
  CurrentTenancyCard,
} from "./components/ApartmentOperations";
import { fullName } from "./components/DetailPrimitives";
import type {
  Activity,
  Application,
  Landlord,
  Maintenance,
  Review,
  Summary,
  Tenancy,
  Verification,
  Visit,
} from "./types";

export const dynamic = "force-dynamic";
const PREVIEW_LIMIT = 3;

export default async function AdminApartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: apartment, error: apartmentError } = await supabase
    .from("apartments")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (apartmentError) {
    console.error("Admin apartment detail lookup failed", apartmentError);
    throw new Error("Unable to load the apartment. Refresh and try again.");
  }
  if (!apartment) notFound();

  const [
    landlordResult,
    imagesResult,
    verificationResult,
    tenancyResult,
    applicationsResult,
    visitsResult,
    maintenanceResult,
    reviewsResult,
    apartmentAuditResult,
  ] = await Promise.all([
    apartment.landlord_id
      ? supabase
          .from("users")
          .select(
            "id, first_name, last_name, email, mobile_number, avatar_url, account_status, created_at, updated_at",
          )
          .eq("id", apartment.landlord_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("apartment_images")
      .select("id, url, url_thumb, is_cover")
      .eq("apartment_id", id)
      .order("is_cover", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(30),
    supabase
      .from("apartment_verifications")
      .select(
        "id, status, submitted_at, reviewed_at, reviewed_by, rejection_reason",
      )
      .eq("apartment_id", id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    supabase
      .from("tenancies")
      .select(
        "id, status, lease_start, lease_end, monthly_rent, tenant:users!tenancies_tenant_id_fkey(first_name,last_name)",
      )
      .eq("apartment_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("rental_application")
      .select("id, status, created_at")
      .eq("apartment_id", id)
      .order("created_at", { ascending: false })
      .limit(PREVIEW_LIMIT),
    supabase
      .from("visit_request")
      .select("id, status, visit_date, confirmed_visit_date")
      .eq("apartment_id", id)
      .order("created_at", { ascending: false })
      .limit(PREVIEW_LIMIT),
    supabase
      .from("maintenance_request")
      .select("id, title, urgency, status, created_at")
      .eq("apartment_id", id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at")
      .eq("apartment_id", id)
      .order("created_at", { ascending: false })
      .limit(PREVIEW_LIMIT),
    supabase
      .from("admin_audit_logs")
      .select(
        "id, action, reason, created_at, admin:users!admin_audit_logs_admin_id_fkey(first_name,last_name)",
      )
      .eq("target_type", "apartment")
      .eq("target_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Exact head counts: previews must never be mistaken for totals. Keep every
  // query scoped to the apartment, and never download all application records.
  const applicationStatuses = [
    "total",
    "pending",
    "approved",
    "rejected",
  ] as const;
  const visitStatuses = [
    "total",
    "pending",
    "approved",
    "rescheduled",
    "cancelled",
    "rejected",
  ] as const;
  const maintenanceStatuses = [
    "pending",
    "in_progress",
    "resolved",
    "high",
  ] as const;
  const [applicationCounts, visitCounts, maintenanceCounts, propertyCount, verifiedPropertyCount] =
    await Promise.all([
      Promise.all(
        applicationStatuses.map(async (status) => {
          let query = supabase
            .from("rental_application")
            .select("id", { count: "exact", head: true })
            .eq("apartment_id", id);
          if (status !== "total") query = query.eq("status", status);
          const result = await query;
          return { status, count: result.count, error: result.error };
        }),
      ),
      Promise.all(
        visitStatuses.map(async (status) => {
          let query = supabase
            .from("visit_request")
            .select("id", { count: "exact", head: true })
            .eq("apartment_id", id);
          if (status !== "total") query = query.eq("status", status);
          const result = await query;
          return { status, count: result.count, error: result.error };
        }),
      ),
      Promise.all(
        maintenanceStatuses.map(async (status) => {
          let query = supabase
            .from("maintenance_request")
            .select("id", { count: "exact", head: true })
            .eq("apartment_id", id);
          query =
            status === "high"
              ? query
                  .eq("urgency", "high")
                  .in("status", ["pending", "in_progress"])
              : query.eq("status", status);
          const result = await query;
          return { status, count: result.count, error: result.error };
        }),
      ),
      apartment.landlord_id
        ? supabase
            .from("apartments")
            .select("id", { count: "exact", head: true })
            .eq("landlord_id", apartment.landlord_id)
            .is("deleted_at", null)
        : Promise.resolve({ count: null, error: null }),
      apartment.landlord_id
        ? supabase
            .from("apartments")
            .select("id", { count: "exact", head: true })
            .eq("landlord_id", apartment.landlord_id)
            .eq("is_verified", true)
            .is("deleted_at", null)
        : Promise.resolve({ count: null, error: null }),
    ]);

  const verifications = verificationResult.data ?? [];
  const reviewerIds = [
    ...new Set(
      verifications
        .map((item) => item.reviewed_by)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const [reviewersResult, verificationAuditResult, paymentResult, leaseResult] =
    await Promise.all([
      reviewerIds.length
        ? supabase
            .from("users")
            .select("id, first_name, last_name")
            .in("id", reviewerIds)
        : Promise.resolve({ data: [], error: null }),
      verifications.length
        ? supabase
            .from("admin_audit_logs")
            .select(
              "id, action, reason, created_at, admin:users!admin_audit_logs_admin_id_fkey(first_name,last_name)",
            )
            .eq("target_type", "apartment_verification")
            .in(
              "target_id",
              verifications.map((item) => item.id),
            )
            .order("created_at", { ascending: false })
            .limit(20)
        : Promise.resolve({ data: [], error: null }),
      tenancyResult.data
        ? supabase
            .from("payment")
            .select("status, date, due_date")
            .eq("tenancy_id", tenancyResult.data.id)
            .order("date", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      apartment.lease_agreement_url && verifications.length
        ? supabase.storage
            .from("lease-agreements")
            .createSignedUrl(apartment.lease_agreement_url, 600)
        : Promise.resolve({ data: null, error: null }),
    ]);

  const reviewers = new Map(
    (reviewersResult.data ?? []).map((item) => [item.id, fullName(item)]),
  );
  const verification: Verification | null = verifications[0]
    ? {
        ...verifications[0],
        reviewer_name: verifications[0].reviewed_by
          ? (reviewers.get(verifications[0].reviewed_by) ?? null)
          : null,
      }
    : null;
  const tenancy: Tenancy | null = tenancyResult.data
    ? {
        ...tenancyResult.data,
        tenant_name: fullName(tenancyResult.data.tenant) || null,
      }
    : null;
  const counts = (
    rows: Array<{ status: string; count: number | null; error: unknown }>,
  ) => Object.fromEntries(rows.map((row) => [row.status, row.count ?? 0]));
  const applications: Summary<Application> = {
    items: applicationsResult.data ?? [],
    counts: counts(applicationCounts),
    error: Boolean(
      applicationsResult.error || applicationCounts.some((row) => row.error),
    ),
  };
  const visits: Summary<Visit> = {
    items: visitsResult.data ?? [],
    counts: counts(visitCounts),
    error: Boolean(visitsResult.error || visitCounts.some((row) => row.error)),
  };
  const maintenance: Summary<Maintenance> = {
    items: maintenanceResult.data ?? [],
    counts: counts(maintenanceCounts),
    error: Boolean(
      maintenanceResult.error || maintenanceCounts.some((row) => row.error),
    ),
  };
  const auditRows = [
    ...(apartmentAuditResult.data ?? []),
    ...(verificationAuditResult.data ?? []),
  ];
  const activity: Activity[] = [
    ...auditRows.map((row) => ({
      id: row.id,
      action: row.action,
      reason: row.reason,
      created_at: row.created_at,
      admin_name: fullName(row.admin) || null,
    })),
    ...verifications.map((row) => ({
      id: `submission-${row.id}`,
      action: "Verification submitted",
      reason: null,
      created_at: row.submitted_at,
      admin_name: "Landlord",
    })),
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 20);
  const operationalError = Boolean(tenancyResult.error || paymentResult.error);
  const sectionErrors = {
    landlord: Boolean(
      landlordResult.error || propertyCount.error || verifiedPropertyCount.error,
    ),
    images: Boolean(imagesResult.error),
    verification: Boolean(verificationResult.error || reviewersResult.error),
    tenancy: operationalError,
    applications: applications.error,
    visits: visits.error,
    maintenance: maintenance.error,
    reviews: Boolean(reviewsResult.error),
    activity: Boolean(
      apartmentAuditResult.error ||
      verificationAuditResult.error ||
      verificationResult.error,
    ),
  };
  if (Object.values(sectionErrors).some(Boolean)) {
    console.error(
      "Admin apartment detail sections unavailable",
      Object.entries(sectionErrors)
        .filter(([, failed]) => failed)
        .map(([section]) => section),
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)] xl:gap-4">
        <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-3">
          <ApartmentOverview
            apartment={apartment}
            verification={verification}
            images={imagesResult.data ?? []}
            imagesError={sectionErrors.images}
          />
          <ApartmentPipelineSummary
            applications={applications}
            visits={visits}
          />
          <ApartmentMaintenanceSummary summary={maintenance} />
          <ApartmentReviewsSummary
            reviews={(reviewsResult.data ?? []) as Review[]}
            rating={apartment.average_rating}
            total={apartment.no_ratings}
            error={sectionErrors.reviews}
          />
          <ApartmentActivityTimeline
            events={activity}
            createdAt={apartment.created_at}
            error={sectionErrors.activity}
          />
        </div>
        <aside
          className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-3"
          aria-label="Admin controls and contacts"
        >
          <ApartmentVerificationCard
            apartment={apartment}
            verification={verification}
            error={sectionErrors.verification}
            leaseUrl={leaseResult.data?.signedUrl ?? null}
          />
          <ApartmentListingControls apartment={apartment} />
          <CurrentTenancyCard
            tenancy={tenancy}
            payment={paymentResult.data}
            error={Boolean(tenancyResult.error)}
            paymentError={Boolean(paymentResult.error)}
            occupied={apartment.status === "occupied"}
          />
          <ApartmentLandlordCard
            landlord={landlordResult.data as Landlord | null}
            count={propertyCount.count}
            verifiedCount={verifiedPropertyCount.count}
            error={sectionErrors.landlord}
          />
        </aside>
      </div>
    </div>
  );
}
