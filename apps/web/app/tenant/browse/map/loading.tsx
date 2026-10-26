import MapSearchSkeleton from "@/app/browse/map/components/MapSearchSkeleton";
import { MAP_LAYOUT_TENANT } from "@/app/browse/lib/browse-layout";

export default function TenantBrowseMapLoading() {
  return <MapSearchSkeleton layout={MAP_LAYOUT_TENANT} />;
}
