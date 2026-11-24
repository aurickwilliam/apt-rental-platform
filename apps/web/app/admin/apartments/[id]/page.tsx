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
  ApartmentRentalActivity,
  Landlord,
  Review,
  Summary,
  Verification,
} from "./types";

export const dynamic = "force-dynamic";
const PREVIEW_LIMIT = 3;
const UNAVAILABLE_SUMMARY = { items: [], counts: {}, error: true };

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

  const previewsPromise = Promise.all([
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
    // Admins have no read access to these tables: the function returns only
    // what this page shows, with exact counts rather than preview lengths.
    supabase.rpc("get_admin_apartment_activity", { p_apartment_id: id }),
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

  const countsPromise = Promise.all([
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

  // Counts need only the already-authorized apartment, not its previews.
  // Keep one coherent result, but overlap the two independent request waves.
  const [
    [landlordResult, imagesResult, verificationResult, rentalResult, reviewsResult, apartmentAuditResult],
    [propertyCount, verifiedPropertyCount],
  ] = await Promise.all([previewsPromise, countsPromise]);

  const verifications = verificationResult.data ?? [];
  const reviewerIds = [
    ...new Set(
      verifications
        .map((item) => item.reviewed_by)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  const [reviewersResult, verificationAuditResult, leaseResult] =
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
  const rental = rentalResult.error
    ? null
    : (rentalResult.data as unknown as ApartmentRentalActivity);
  const summary = <T,>(value: Pick<Summary<T>, "items" | "counts"> | undefined): Summary<T> =>
    value ? { ...value, error: false } : UNAVAILABLE_SUMMARY;
  const applications = summary(rental?.applications);
  const visits = summary(rental?.visits);
  const maintenance = summary(rental?.maintenance);
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
  const rentalError = !rental;
  const sectionErrors = {
    landlord: Boolean(
      landlordResult.error || propertyCount.error || verifiedPropertyCount.error,
    ),
    images: Boolean(imagesResult.error),
    verification: Boolean(verificationResult.error || reviewersResult.error),
    tenancy: rentalError,
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
    <div className="w-full space-y-4 p-4">
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
            tenancy={rental?.tenancy ?? null}
            payment={rental?.payment ?? null}
            error={rentalError}
            paymentError={rentalError}
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
