import MapSearchSkeleton from "@/app/browse/map/components/MapSearchSkeleton";
import { MAP_HEIGHT_TENANT } from "@/app/browse/lib/browse-layout";

export default function TenantBrowseMapLoading() {
  return <MapSearchSkeleton heightClassName={MAP_HEIGHT_TENANT} />;
}
