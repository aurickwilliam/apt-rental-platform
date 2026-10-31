import PublicProfileReviewsSkeleton from "@/app/components/profile/public/PublicProfileReviewsSkeleton";

import { browseFrameClass } from "../../../lib/browse-layout";

export default function PublicLandlordReviewsLoading() {
  return (
    <div className={browseFrameClass(false)}>
      <PublicProfileReviewsSkeleton />
    </div>
  );
}
