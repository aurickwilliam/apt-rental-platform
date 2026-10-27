import { notFound } from "next/navigation";

import LandlordProfileView from "@/app/components/profile/public/LandlordProfileView";
import { loadLandlordProfile } from "@/lib/public-profile-loaders";

import { browseFrameClass } from "../../lib/browse-layout";

export default async function PublicLandlordProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ landlordId: string }>;
  searchParams: Promise<{ reviews?: string }>;
}) {
  const { landlordId } = await params;
  const { reviews } = await searchParams;
  const data = await loadLandlordProfile(landlordId, { allReviews: reviews === "all" });
  if (!data) notFound();

  return (
    <div className={browseFrameClass(false)}>
      <LandlordProfileView data={data} portal="public" />
    </div>
  );
}
