import { createRoot } from "react-dom/client";

import PropertiesTableSection from "../../app/landlord/properties/components/PropertiesTableSection";

// Fixture rows only. The table, drawer and edit dialog are the production
// components, so the overlay layers behave exactly as they do on My Properties.
const THUMBNAIL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#dbeafe"/></svg>',
  );

const FIXTURES = [
  {
    id: "fixture-alpha",
    name: "Preview Alpha",
    description: "First fixture listing.",
    monthly_rent: 15000,
    security_deposit: 30000,
    advance_rent: 15000,
    type: "Apartment",
    street_address: "123 Preview Street",
    barangay: "Barangay 1",
    city: "Caloocan",
    province: "Metro Manila",
    zip_code: 1400,
    status: "available",
    average_rating: 4.5,
    no_ratings: 2,
    no_bedrooms: 2,
    no_bathrooms: 1,
    area_sqm: 42,
    max_occupants: 4,
    furnished_type: "Semi-Furnished",
    floor_level: "Ground Floor",
    lease_duration: "1 Year",
    latitude: 14.6571,
    longitude: 120.9831,
    amenities: ["wifi", "aircon"],
    thumbnail: THUMBNAIL,
    lease_agreement_url: null,
  },
  {
    id: "fixture-beta",
    name: "Preview Beta",
    description: "Second fixture listing.",
    monthly_rent: 22000,
    security_deposit: 44000,
    advance_rent: 22000,
    type: "Condo Unit",
    street_address: "456 Preview Avenue",
    barangay: "Barangay 2",
    city: "Valenzuela",
    province: "Metro Manila",
    zip_code: 1440,
    status: "occupied",
    average_rating: 4,
    no_ratings: 1,
    no_bedrooms: 1,
    no_bathrooms: 1,
    area_sqm: 30,
    max_occupants: 2,
    furnished_type: "Fully Furnished",
    floor_level: "2nd-5th Floor",
    lease_duration: "6 Months",
    latitude: 14.6942,
    longitude: 120.9833,
    amenities: ["wifi"],
    thumbnail: THUMBNAIL,
    lease_agreement_url: null,
  },
];

window.fixtureWrites = [];
window.fixtureRpcs = [];

createRoot(document.getElementById("root")).render(
  <main className="mx-auto w-full max-w-[960px] p-6">
    <h1 className="mb-4 text-xl font-semibold">My Properties (fixture)</h1>
    <PropertiesTableSection properties={FIXTURES} />
  </main>,
);
