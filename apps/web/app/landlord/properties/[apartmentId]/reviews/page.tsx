import { createClient } from "@repo/supabase/server";
import { fetchLandlordUnitReviews } from "@/service/landlordUnitDetailService";
import { getLandlordUnitDetail, UnitNotice } from "../lib/get-unit-detail";
import ReviewsClient from "./components/ReviewsClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ apartmentId: string }>;
};

export default async function LandlordPropertyReviewsPage({ params }: PageProps) {
  const { apartmentId } = await params;
  const result = await getLandlordUnitDetail(apartmentId);
  if ("error" in result) {
    return <UnitNotice title={result.error.title} message={result.error.message} />;
  }

  const supabase = await createClient();
  const reviews = await fetchLandlordUnitReviews(supabase, apartmentId).catch(() => null);
  if (!reviews) {
    return <UnitNotice title="Could not load reviews" message="Something went wrong. Please try again." />;
  }

  return <ReviewsClient apartmentId={apartmentId} apartmentName={result.detail.apartment.name} reviews={reviews} />;
}
