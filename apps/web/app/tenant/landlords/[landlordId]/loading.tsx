import PublicProfileSkeleton from "@/app/components/profile/public/PublicProfileSkeleton";

import { browseFrameClass } from "../../../browse/lib/browse-layout";

export default function TenantLandlordProfileLoading() {
  return (
    <div className={browseFrameClass(true)}>
      <PublicProfileSkeleton />
    </div>
  );
}
