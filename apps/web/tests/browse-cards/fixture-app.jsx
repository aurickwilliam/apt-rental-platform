import { useState } from "react";
import { createRoot } from "react-dom/client";
import BrowseSectionsList from "../../app/browse/components/BrowseSectionsList";
import RenderApartments from "../../app/browse/components/RenderApartments";
import { fixture, update } from "./fixture-transports";
import { RECOMMENDED_SECTION_ID } from "../../app/browse/lib/recommended-section";

const image = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#d8e5f5"/><path d="M70 420V230l220-130 240 130v190" fill="#8eabd3"/></svg>');
const apartments = [
  { id: "one", name: "Kaunlaran Village Quiet 2BR", location: "Kaunlaran Village, Caloocan", city: "Caloocan", price: 18000, rating: 4.5, bedrooms: 2, bathrooms: 1, areaSqm: 35, amenities: ["petfriendly", "parking"], isVerified: true, image },
  { id: "two", name: "Malabon Studio", location: "Longos, Malabon", city: "Malabon", price: 9000, rating: 4, bedrooms: 0, amenities: ["parking"], image },
  { id: "three", name: "Spacious Home with a Very Long Apartment Name", location: "Malanday, Valenzuela", city: "Valenzuela", price: 1250000, rating: 0, bedrooms: 4, image },
];
const sections = [
  { id: RECOMMENDED_SECTION_ID, title: "Recommended for You", apartments, seeAllHref: "/tenant/browse?city=Caloocan" },
  { id: "city:Caloocan", title: "Apartments in Caloocan", apartments, seeAllHref: null },
];
function App() {
  const [mode, setMode] = useState("sections");
  // Read fixture data through production useUser/useFavorites consumers; these controls simulate saved-profile/account changes.
  return <main className="mx-auto max-w-5xl p-6" style={{ minHeight: "180vh" }}>
    <div style={{ display: "flex", gap: 16, marginBottom: 80 }}>
      <button onClick={() => setMode(mode === "sections" ? "grid" : "sections")}>Switch layout</button>
      <button onClick={() => { fixture.preferences = { selectedCities: ["Malabon"] }; update(); }}>Change saved preferences</button>
      <button onClick={() => { fixture.userId = null; update(); }}>Sign out</button>
    </div>
    {mode === "sections" ? <BrowseSectionsList sections={sections} basePath="/tenant/browse" /> :
      <RenderApartments apartment={apartments} page={1} pageSize={25} totalCount={3} basePath="/tenant/browse" />}
    <output id="destination">{fixture.navigation.at(-1) ?? "none"}</output>
  </main>;
}
window.browseFixture = fixture;
createRoot(document.getElementById("root")).render(<App />);
