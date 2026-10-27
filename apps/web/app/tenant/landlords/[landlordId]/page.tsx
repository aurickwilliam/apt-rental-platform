import { notFound } from "next/navigation";

import LandlordProfileView from "@/app/components/profile/public/LandlordProfileView";
import { requirePortalViewer } from "@/lib/server-identity";
import { loadLandlordProfile } from "@/lib/public-profile-loaders";

import { browseFrameClass } from "../../../browse/lib/browse-layout";

export default async function TenantLandlordProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ landlordId: string }>;
  searchParams: Promise<{ reviews?: string }>;
}) {
  const { landlordId } = await params;
  const { reviews } = await searchParams;
  await requirePortalViewer("tenant");

  const data = await loadLandlordProfile(landlordId, { allReviews: reviews === "all" });
  if (!data) notFound();

  return (
    <div className={browseFrameClass(true)}>
      <LandlordProfileView data={data} portal="tenant" />
    </div>
  );
}
