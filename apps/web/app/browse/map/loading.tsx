import { MAP_HEIGHT_PUBLIC } from "../lib/browse-layout";
import MapSearchSkeleton from "./components/MapSearchSkeleton";

export default function BrowseMapLoading() {
  return <MapSearchSkeleton heightClassName={MAP_HEIGHT_PUBLIC} />;
}
