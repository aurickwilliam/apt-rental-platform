import { Suspense } from "react";

import { requirePortalViewer } from "@/lib/server-identity";

import MapSearchClient from "@/app/browse/map/components/MapSearchClient";
import MapSearchSkeleton from "@/app/browse/map/components/MapSearchSkeleton";
import { MAP_LAYOUT_TENANT } from "@/app/browse/lib/browse-layout";

// Tenant-shell map search; same components as the public /browse/map. The
// route is per-request like Browse (filters live in the query string).
export const dynamic = "force-dynamic";

export default async function TenantBrowseMapPage() {
  await requirePortalViewer("tenant");

  return (
    <Suspense fallback={<MapSearchSkeleton layout={MAP_LAYOUT_TENANT} />}>
      <MapSearchClient basePath="/tenant/browse" layout={MAP_LAYOUT_TENANT} />
    </Suspense>
  );
}
