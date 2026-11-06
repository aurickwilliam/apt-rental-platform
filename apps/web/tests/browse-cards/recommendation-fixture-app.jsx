// Exercises the real server discovery pipeline with only its database transport replaced.
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import BrowseSectionsList from "../../app/browse/components/BrowseSectionsList";
import { loadDiscoverySections } from "../../app/browse/lib/fetch-browse-discovery";
import { parseTenantPreferences, DEFAULT_TENANT_PREFERENCES } from "../../lib/tenant-preferences";
import { createListingQueryFixture } from "./listing-query-fixture.mjs";
import { fixture, update } from "./fixture-transports";

const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#d8e5f5"/></svg>');
const initial = { ...DEFAULT_TENANT_PREFERENCES, selectedCities: ["Navotas"], budgetMin: 5000, budgetMax: 14999, bedroomCount: "1-2 Bedrooms", hasParking: true };
const rents = [4999, 5000, 7500, 14999, 15000, 22000, 45000, 65000];
const allRows = rents.map(rent => ({
  id: `navotas-${rent}`, name: `Navotas home ${rent}`, city: "Navotas", barangay: "San Jose",
  monthly_rent: rent, average_rating: 4.5, no_bedrooms: 2, no_bathrooms: 1, area_sqm: 35,
  amenities: ["parking"], is_verified: true, status: "available", is_hidden_by_admin: false, deleted_at: null,
  apartment_images: [{ url: image, url_thumb: image, is_cover: true }],
}));
allRows.push({ ...allRows[2], id: "wrong-city", name: "Caloocan home", city: "Caloocan" });
const empty = new URLSearchParams(location.search).has("empty");
const rows = empty ? allRows.filter(row => row.monthly_rent >= 15000) : allRows;
const storageKey = `apt-recommendation-fixture:${empty ? "empty" : "normal"}`;
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
  const widen = () => {
    localStorage.setItem(storageKey, JSON.stringify({ ...saved(), budgetMax: 29999 }));
    fixture.preferences = saved(); update(); setRevision(value => value + 1);
  };
  return <main className="mx-auto max-w-5xl p-6">
    <h1>Saved-preference recommendation regression</h1>
    <button onClick={widen}>Save wider budget</button>
    <output id="saved-preferences">{JSON.stringify(fixture.preferences)}</output>
    {error ? <p role="alert">{error}</p> : sections ? <BrowseSectionsList sections={sections} basePath="/tenant/browse" /> : <p role="status">Loading recommendations</p>}
  </main>;
}
window.recommendationFixture = { client, fixture };
createRoot(document.getElementById("root")).render(<App />);
