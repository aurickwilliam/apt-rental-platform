import { notFound, redirect } from "next/navigation";

import LandlordProfileView from "@/app/components/profile/public/LandlordProfileView";
import { landlordReviewsHref, parseProfileApartmentId } from "@/lib/public-profile";
import { loadLandlordProfile } from "@/lib/public-profile-loaders";

import { browseFrameClass } from "../../lib/browse-layout";

export default async function PublicLandlordProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ landlordId: string }>;
  searchParams: Promise<{ reviews?: string; apartmentId?: string | string[] }>;
}) {
  const { landlordId } = await params;
  const { reviews, apartmentId } = await searchParams;

  // The old in-place "See all reviews" query now has its own page.
  if (reviews === "all") redirect(landlordReviewsHref("public", landlordId));

  const data = await loadLandlordProfile(landlordId, parseProfileApartmentId(apartmentId));
  if (!data) notFound();

  return (
    <div className={browseFrameClass(false)}>
      <LandlordProfileView data={data} portal="public" />
    </div>
  );
}
