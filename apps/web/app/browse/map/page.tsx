import { Suspense } from "react";

import { MAP_HEIGHT_PUBLIC } from "../lib/browse-layout";
import MapSearchClient from "./components/MapSearchClient";
import MapSearchSkeleton from "./components/MapSearchSkeleton";

export default function BrowseMapPage() {
  return (
    <Suspense fallback={<MapSearchSkeleton heightClassName={MAP_HEIGHT_PUBLIC} />}>
      <MapSearchClient basePath="/browse" heightClassName={MAP_HEIGHT_PUBLIC} />
    </Suspense>
  );
}
