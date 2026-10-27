import { notFound } from "next/navigation";

import LandlordProfileView from "@/app/components/profile/public/LandlordProfileView";
import { loadLandlordProfile } from "@/lib/public-profile-loaders";

import { browseFrameClass } from "../../lib/browse-layout";

export default async function PublicLandlordProfilePage({
  params,
}: {
  params: Promise<{ landlordId: string }>;
}) {
  const { landlordId } = await params;
  const data = await loadLandlordProfile(landlordId);
  if (!data) notFound();

  return (
    <div className={browseFrameClass(false)}>
      <LandlordProfileView data={data} portal="public" />
    </div>
  );
}
