import Link from "next/link";
import { notFound } from "next/navigation";
import { Link as HeroUILink } from "@heroui/react";
import {
  IconChevronLeft,
  IconFileText,
  IconShieldCheck,
} from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../../_lib/require-admin";
import { reviewApartmentVerification } from "../../../actions/verification";
import { ApartmentOverview } from "../../../apartments/[id]/components/ApartmentOverview";
import { ApartmentLandlordCard } from "../../../apartments/[id]/components/ApartmentSidebar";
import {
  fullName,
  Section,
} from "../../../apartments/[id]/components/DetailPrimitives";
import type { Landlord, Verification } from "../../../apartments/[id]/types";
import { ReviewForm } from "../../ReviewForm";
import VerificationStatusCard from "../../components/VerificationStatusCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApartmentVerificationReviewPage({
  params,
}: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: verification, error: verificationError } = await supabase
    .from("apartment_verifications")
    .select(
      "id, apartment_id, landlord_id, status, submitted_at, reviewed_at, reviewed_by, rejection_reason",
    )
    .eq("id", id)
    .maybeSingle();

  if (verificationError) {
    console.error(
      "Admin apartment verification lookup failed",
      verificationError,
    );
    throw new Error("Unable to load the verification. Refresh and try again.");
  }
  if (!verification) notFound();

  const [
    apartmentResult,
    landlordResult,
    imagesResult,
    reviewerResult,
    propertyCount,
    verifiedPropertyCount,
  ] = await Promise.all([
    supabase
      .from("apartments")
      .select("*")
      .eq("id", verification.apartment_id)
      .maybeSingle(),
    supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, mobile_number, avatar_url, account_status, created_at, updated_at",
      )
      .eq("id", verification.landlord_id)
      .maybeSingle(),
    supabase
      .from("apartment_images")
      .select("id, url, url_thumb, is_cover")
      .eq("apartment_id", verification.apartment_id)
      .order("is_cover", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(30),
    verification.reviewed_by
      ? supabase
          .from("users")
          .select("first_name, last_name, email")
          .eq("id", verification.reviewed_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .eq("landlord_id", verification.landlord_id)
      .is("deleted_at", null),
    supabase
      .from("apartments")
      .select("id", { count: "exact", head: true })
      .eq("landlord_id", verification.landlord_id)
      .eq("is_verified", true)
      .is("deleted_at", null),
  ]);

  if (apartmentResult.error) {
    console.error(
      "Admin verification apartment lookup failed",
      apartmentResult.error,
    );
    throw new Error("Unable to load the apartment. Refresh and try again.");
  }
  const apartment = apartmentResult.data;
  if (!apartment) notFound();

  const leaseFileName = apartment.lease_agreement_url?.split("/").at(-1);
  const leasePreviewSupported = /\.(pdf|docx)$/i.test(leaseFileName ?? "");
  const leaseResult =
    apartment.lease_agreement_url && leasePreviewSupported
      ? await supabase.storage
          .from("lease-agreements")
          .createSignedUrl(apartment.lease_agreement_url, 60)
      : null;
  if (leaseResult?.error) {
    console.error(
      "Admin verification lease agreement signing failed",
      leaseResult.error,
    );
  }
  if (
    landlordResult.error ||
    reviewerResult.error ||
    imagesResult.error ||
    propertyCount.error ||
    verifiedPropertyCount.error
  ) {
    console.error("Admin apartment verification sections unavailable", {
      landlord: landlordResult.error,
      reviewer: reviewerResult.error,
      images: imagesResult.error,
      properties: propertyCount.error,
      verifiedProperties: verifiedPropertyCount.error,
    });
  }

  const reviewerName =
    fullName(reviewerResult.data) || reviewerResult.data?.email || null;
  const overviewVerification: Verification = {
    ...verification,
    reviewer_name: reviewerName,
  };

  return (
    <div
      className={`mx-auto w-full max-w-7xl space-y-4 p-4 ${verification.status === "pending" ? "pb-48 md:pb-28" : ""}`}
    >
      <header>
        <Link
          href="/admin/verification?tab=apartments"
          className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconChevronLeft size={18} aria-hidden="true" />
          Back to verification table
        </Link>
        <h1 className="mt-3 flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <IconShieldCheck size={28} aria-hidden="true" />
          </span>
          Apartment Verification
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="min-w-0">
          <ApartmentOverview
            apartment={apartment}
            verification={overviewVerification}
            images={imagesResult.data ?? []}
            imagesError={Boolean(imagesResult.error)}
            reviewMode
          />
        </div>
        <aside
          className="grid min-w-0 content-start gap-3"
          aria-label="Verification details"
        >
          <VerificationStatusCard
            subjectLabel="Apartment"
            subjectStatus={apartment.is_verified ? "verified" : "unverified"}
            status={verification.status}
            submittedAt={verification.submitted_at}
            reviewedAt={verification.reviewed_at}
            reviewerName={reviewerName}
            rejectionReason={verification.rejection_reason}
          />
          <div className="min-w-0">
            <ApartmentLandlordCard
              landlord={landlordResult.data as Landlord | null}
              count={propertyCount.count}
              verifiedCount={verifiedPropertyCount.count}
              error={Boolean(
                landlordResult.error ||
                propertyCount.error ||
                verifiedPropertyCount.error,
              )}
            />
          </div>
          <Section title="Lease agreement" icon={<IconFileText size={20} />}>
            {leaseFileName ? (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="min-w-0 wrap-break-word text-sm text-foreground">
                  {leaseFileName}
                </span>
                {leaseResult?.data?.signedUrl ? (
                  <HeroUILink
                    href={`/admin/verification/apartments/${verification.id}/lease`}
                    className="shrink-0 text-sm font-semibold text-primary"
                    aria-label={`View ${leaseFileName}`}
                  >
                    View
                    <HeroUILink.Icon />
                  </HeroUILink>
                ) : (
                  <span
                    role={leaseResult?.error ? "alert" : undefined}
                    className={
                      leaseResult?.error
                        ? "text-sm text-danger"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {leasePreviewSupported
                      ? "Lease unavailable. Refresh and try again."
                      : "Preview unavailable for this file type."}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No lease agreement was submitted.
              </p>
            )}
          </Section>
        </aside>
      </div>

      {verification.status === "pending" ? (
        <ReviewForm
          verificationId={verification.id}
          kind="apartment"
          onReview={reviewApartmentVerification}
          sticky
        />
      ) : null}
    </div>
  );
}
