import { notFound, redirect } from "next/navigation";

import LandlordProfileView from "@/app/components/profile/public/LandlordProfileView";
import { requirePortalViewer } from "@/lib/server-identity";
import { landlordReviewsHref } from "@/lib/public-profile";
import { loadLandlordProfile } from "@/lib/public-profile-loaders";

import { browseFrameClass } from "../../../browse/lib/browse-layout";

export default async function LandlordViewingLandlordProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ landlordId: string }>;
  searchParams: Promise<{ reviews?: string }>;
}) {
  const { landlordId } = await params;
  const { reviews } = await searchParams;
  await requirePortalViewer("landlord");

  // The old in-place "See all reviews" query now has its own page.
  if (reviews === "all") redirect(landlordReviewsHref("landlord", landlordId));

  const data = await loadLandlordProfile(landlordId);
  if (!data) notFound();

  return (
    <div className={browseFrameClass(true)}>
      <LandlordProfileView data={data} portal="landlord" />
    </div>
  );
}
