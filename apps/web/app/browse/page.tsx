import { createClient } from '@repo/supabase/server';
import FilterContainer from "./components/FilterContainer";
import RenderApartments from "./components/RenderApartments";
import SearchContainer from "./components/SearchContainer";

export default async function BrowsePage() {
  const supabase = await createClient();

  const { data: apartments, error } = await supabase
    .from('apartments')
    .select(`
      id,
      name,
      city,
      monthly_rent,
      average_rating,
      apartment_images(url, is_cover)
    `);

  if (error) console.error(error);

  const mapped = (apartments ?? []).map((apt) => ({
    id: apt.id,
    name: apt.name,
    location: apt.city,
    price: apt.monthly_rent,
    rating: apt.average_rating ?? 0,
    image: apt.apartment_images?.find((img) => img.is_cover)?.url ?? '/default/default-thumbnail.jpeg',
  }));

  return (
    <div className="max-w-7xl mx-auto p-4">
      <SearchContainer />
      <div className="mt-4 flex flex-col md:flex-row gap-3">
        <FilterContainer />
        <div className="w-full md:w-3/4 bg-white rounded-lg p-0">
          <RenderApartments apartment={mapped} />
        </div>
      </div>
    </div>
  );
}
