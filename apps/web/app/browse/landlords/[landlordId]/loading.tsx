import PublicProfileSkeleton from "@/app/components/profile/public/PublicProfileSkeleton";

import { browseFrameClass } from "../../lib/browse-layout";

export default function PublicLandlordProfileLoading() {
  return (
    <div className={browseFrameClass(false)}>
      <PublicProfileSkeleton />
    </div>
  );
}
