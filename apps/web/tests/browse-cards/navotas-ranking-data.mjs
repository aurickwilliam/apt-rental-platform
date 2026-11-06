// Public listing fields observed through the web app's anonymous/RLS-bound endpoint
// on 2026-11-06. Test IDs and visibility flags are fixture scaffolding, not live IDs.
// Supplied preference values are a test snapshot, not a read of a private user profile.
export const navotasRankingRows = [
  { id: "tangos", name: "Tangos Cozy 2BR", monthly_rent: 22000, no_bedrooms: 2, amenities: ["parking"], average_rating: 4.5 },
  { id: "lower-bicutan", name: "Lower Bicutan Affordable 2BR", monthly_rent: 15000, no_bedrooms: 2, amenities: ["parking"], average_rating: null },
  { id: "san-roque", name: "San Roque Garden View 1BR", monthly_rent: 18000, no_bedrooms: 1, amenities: ["parking"], average_rating: null },
  { id: "bagumbayan", name: "Bagumbayan Norte Sea View Studio", monthly_rent: 16000, no_bedrooms: 1, amenities: ["wifi", "cctv", "ac", "elevator", "security"], average_rating: null },
].map(row => ({
  ...row, city: "Navotas", barangay: "", is_verified: true,
  status: "available", is_hidden_by_admin: false, deleted_at: null, apartment_images: [],
}));
