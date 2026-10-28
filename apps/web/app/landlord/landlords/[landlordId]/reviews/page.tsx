import { notFound } from "next/navigation";

import LandlordReviewsView from "@/app/components/profile/public/LandlordReviewsView";
import { requirePortalViewer } from "@/lib/server-identity";
import { parseProfileReviewSort } from "@/lib/public-profile";
import { loadLandlordReviewsPage } from "@/lib/public-profile-loaders";

import { browseFrameClass } from "../../../../browse/lib/browse-layout";

export default async function LandlordViewingLandlordReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ landlordId: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const { landlordId } = await params;
  const { page, sort } = await searchParams;
  await requirePortalViewer("landlord");

  // The loader clamps the page against the real review count.
  const data = await loadLandlordReviewsPage(landlordId, {
    page: Number.parseInt(page ?? "", 10),
    sort: parseProfileReviewSort(sort),
  });
  if (!data) notFound();

  return (
    <div className={browseFrameClass(true)}>
      <LandlordReviewsView data={data} portal="landlord" />
    </div>
  );
}
