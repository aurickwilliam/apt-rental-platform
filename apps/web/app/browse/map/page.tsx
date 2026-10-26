import { Suspense } from "react";

import { MAP_LAYOUT_PUBLIC } from "../lib/browse-layout";
import MapSearchClient from "./components/MapSearchClient";
import MapSearchSkeleton from "./components/MapSearchSkeleton";

// Per-request like Browse: the filters and camera live in the query string.
export const dynamic = "force-dynamic";

export default function BrowseMapPage() {
  return (
    <Suspense fallback={<MapSearchSkeleton layout={MAP_LAYOUT_PUBLIC} />}>
      <MapSearchClient basePath="/browse" layout={MAP_LAYOUT_PUBLIC} />
    </Suspense>
  );
}
