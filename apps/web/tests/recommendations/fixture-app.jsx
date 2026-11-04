import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@heroui/react";
import BrowseSectionsList from "../../app/browse/components/BrowseSectionsList";
import RenderApartments from "../../app/browse/components/RenderApartments";
import SearchContainer from "../../app/browse/components/SearchContainer";
import { buildRecommendedSection } from "../../app/browse/lib/fetch-recommended";
import { DEFAULT_TENANT_PREFERENCES } from "../../lib/tenant-preferences";

const image = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect fill="%23e0eaff" width="600" height="600"/></svg>';
const apartments = Array.from({ length: 8 }, (_, index) => ({
  id: `apt-${index}`, name: index === 0 ? "Apartment 0 — A very long apartment name that must not resize the card" : `Apartment ${index}`,
  location: index === 1 ? "Barangay San Jose with a very long descriptive locality name, Malabon" : "Longos, Malabon", city: "Malabon",
  price: index === 2 ? 20000 : index === 1 ? 9999 : 10000, rating: index === 2 ? 0 : index === 1 ? 3.5 : 4.5, image, isVerified: true,
  bedrooms: index === 1 || index === 2 ? 5 : 2, bathrooms: 1, areaSqm: 40,
  amenities: index === 1 ? ["petfriendly"] : index === 2 ? [] : ["parking", "petfriendly"],
}));
const generic = { id: "verified", title: "Verified apartments", apartments, seeAllHref: null };
function Fixture() {
  const [changed, setChanged] = useState(false);
  // Baseline leaves the budget at its cleared sentinel so every eligible card
  // can be shown, including one with no match chips. The toggle applies a
  // complete range that still includes every fixture price, proving the chip
  // set follows saved preferences without excluding the zero-chip card.
  const preferences = { ...DEFAULT_TENANT_PREFERENCES, selectedCities: [], budgetMin: changed ? 8000 : 5000,
    budgetMax: changed ? 20000 : 100000, bedroomCount: "1-2 Bedrooms", hasPets: true, hasParking: true };
  const recommended = buildRecommendedSection(apartments, preferences);
  const state = new URLSearchParams(window.location.search).get("state");
  const stateSection = state ? { id: "for_you", title: "Recommended for You",
    subtitle: "Apartments selected based on your rental preferences.", apartments: [],
    recommendationStatus: state, recommendationReasons: {}, seeAllHref: null } : null;
  const grid = new URLSearchParams(window.location.search).has("grid");
  return <>
    <aside className="fixture-sidebar">Tenant sidebar</aside>
    <main className="fixture-main">
      <SearchContainer basePath="/tenant/browse" compact />
      <Button onPress={() => setChanged((value) => !value)}>Change saved budget</Button>
      <p role="status" id="fixture-actions" />
      {grid ? <RenderApartments apartment={apartments} page={1} totalCount={8} pageSize={25} /> :
        stateSection ? <BrowseSectionsList sections={[stateSection]} basePath="/tenant/browse" /> :
        <BrowseSectionsList sections={[recommended, { ...generic, recommendationReasons: recommended?.recommendationReasons }].filter(Boolean)} basePath="/tenant/browse" />}
      <Button>After browsing</Button>
    </main>
  </>;
}
createRoot(document.getElementById("root")).render(<StrictMode><Fixture /></StrictMode>);
