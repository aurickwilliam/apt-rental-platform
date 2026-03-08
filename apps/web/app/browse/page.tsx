import FilterContainer from "./components/FilterContainer";
import RenderApartments from "./components/RenderApartments";
import SearchContainer from "./components/SearchContainer";

export default function BrowsePage() {
  // TODO: Fetch apartments from API instead of hardcoding

  const APARTMENTS = [
    {
      id: "1",
      name: "The Residences at BGC",
      location: "Bonifacio Global City",
      price: 35_000,
      bedrooms: 2,
      bathrooms: 1,
      size: 65,
      type: "Condo",
      amenities: ["Pool", "Gym", "Elevator"],
      image: "https://placehold.co/400x250",
      rating: 4.5,
    },
    {
      id: "2",
      name: "Makati Skyline Suite",
      location: "Makati",
      price: 28_000,
      bedrooms: 1,
      bathrooms: 1,
      size: 42,
      type: "Studio",
      amenities: ["Gym", "Security / CCTV"],
      image: "https://placehold.co/400x250",
      rating: 4.0,
    },
    {
      id: "3",
      name: "Ortigas Garden View",
      location: "Ortigas Center",
      price: 22_000,
      bedrooms: 2,
      bathrooms: 2,
      size: 80,
      type: "Condo",
      amenities: ["Pool", "Gym", "Balcony"],
      image: "https://placehold.co/400x250",
      rating: 4.2,
    },
    {
      id: "4",
      name: "Quezon City Cozy Flat",
      location: "Quezon City",
      price: 18_000,
      bedrooms: 1,
      bathrooms: 1,
      size: 35,
      type: "Apartment",
      amenities: ["Parking", "Security / CCTV"],
      image: "https://placehold.co/400x250",
      rating: 3.8,
    },
    {
      id: "5",
      name: "Pasig Riverfront Condo",
      location: "Pasig",
      price: 30_000,
      bedrooms: 2,
      bathrooms: 1,
      size: 70,
      type: "Condo",
      amenities: ["Pool", "Gym", "Elevator"],
      image: "https://placehold.co/400x250",
      rating: 4.3,
    }
  ]

  return (
    <div className="max-w-7xl mx-auto p-4">
      <SearchContainer />

      {/* Results and Filters */}
      <div className="mt-4 flex flex-col md:flex-row gap-3">

        <FilterContainer />

        {/* Apartment Results */}
        <div className="w-full md:w-3/4 bg-white rounded-lg p-0">
          <RenderApartments apartment={APARTMENTS} />
        </div>
      </div>
    </div>
  );
}
