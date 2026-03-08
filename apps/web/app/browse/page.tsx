import FilterContainer from "./components/FilterContainer";
import SearchContainer from "./components/SearchContainer";

export default function BrowsePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <SearchContainer />

      {/* Results and Filters */}
      <div className="mt-8 flex flex-col md:flex-row gap-8">
        
        <FilterContainer />

        {/* Apartment Results */}
        <div className="w-full md:w-3/4 bg-white rounded-lg p-6">

        </div>
      </div>
    </main>
  );
}
