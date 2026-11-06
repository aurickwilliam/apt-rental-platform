// Real production discovery/ranking + cards, with observed public listing details
// and a saved supplied-preference snapshot; no remote requests or private profile reads.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import BrowseSectionsList from "../../app/browse/components/BrowseSectionsList";
import { loadDiscoverySections } from "../../app/browse/lib/fetch-browse-discovery";
import { DEFAULT_TENANT_PREFERENCES, parseTenantPreferences } from "../../lib/tenant-preferences";
import { createListingQueryFixture } from "./listing-query-fixture.mjs";
import { navotasRankingRows } from "./navotas-ranking-data.mjs";
import { fixture, update } from "./fixture-transports";

const equivalent = new URLSearchParams(location.search).has("equivalent");
const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#d8e5f5"/></svg>');
const rows = navotasRankingRows.map(row => ({ ...row,
  amenities: equivalent ? ["parking"] : row.amenities,
  apartment_images: [{ url: image, url_thumb: image, is_cover: true }],
}));
const initial = { ...DEFAULT_TENANT_PREFERENCES, selectedCities: ["Navotas"], budgetMin: 15000, budgetMax: 29999, bedroomCount: "1-2 Bedrooms", hasParking: true };
const storageKey = `apt-ranking-fixture:${equivalent ? "equivalent" : "observed"}`;
if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(initial));
const saved = () => parseTenantPreferences(JSON.parse(localStorage.getItem(storageKey)));
fixture.preferences = saved();
const client = createListingQueryFixture(() => rows);

function App() {
  const [sections, setSections] = useState(null);
  const [error, setError] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loadDiscoverySections(client, saved(), "/tenant/browse").then(result => {
      if (!cancelled) setSections(result);
    }).catch(error => { if (!cancelled) setError(error.message); });
    return () => { cancelled = true; };
  }, [revision]);
  return <main className="mx-auto max-w-5xl p-6">
    <h1>{equivalent ? "Equivalent-match affordability regression" : "Observed public Navotas listing regression"}</h1>
    <button onClick={() => {
      localStorage.setItem(storageKey, JSON.stringify({ ...saved(), budgetMin: 18000 }));
      fixture.preferences = saved(); update(); setRevision(value => value + 1);
    }}>Save narrower budget</button>
    <output id="saved-preferences">{JSON.stringify(fixture.preferences)}</output>
    {error ? <p role="alert">{error}</p> : sections ? <BrowseSectionsList sections={sections} basePath="/tenant/browse" /> : <p role="status">Loading recommendations</p>}
  </main>;
}
window.rankingFixture = { client };
createRoot(document.getElementById("root")).render(<App />);
