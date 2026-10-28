import PublicProfileReviewsSkeleton from "@/app/components/profile/public/PublicProfileReviewsSkeleton";

import { browseFrameClass } from "../../../../browse/lib/browse-layout";

export default function LandlordViewingLandlordReviewsLoading() {
  return (
    <div className={browseFrameClass(true)}>
      <PublicProfileReviewsSkeleton />
    </div>
  );
}
