import { MAP_LAYOUT_PUBLIC } from "../lib/browse-layout";
import MapSearchSkeleton from "./components/MapSearchSkeleton";

export default function BrowseMapLoading() {
  return <MapSearchSkeleton layout={MAP_LAYOUT_PUBLIC} />;
}
