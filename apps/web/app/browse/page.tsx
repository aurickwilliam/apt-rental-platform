import { Suspense } from "react";
import { createClient } from '@repo/supabase/server';
import FilterContainer from "./components/FilterContainer";
import RenderApartments from "./components/RenderApartments";
import SearchContainer from "./components/SearchContainer";

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

export default async function BrowsePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase.from('apartments').select(`
    id,
    name,
    city,
    monthly_rent,
    average_rating,
    apartment_images(url, is_cover)
  `, { count: 'exact' });

  // --- SearchContainer filters ---

  // Locations
  if (params.locations) {
    query = query.in('city', params.locations.split(','));
  }

  // Price range
  if (params.price_min) query = query.gte('monthly_rent', Number(params.price_min));
  if (params.price_max) query = query.lte('monthly_rent', Number(params.price_max));

  // Apartment types
  if (params.apt_types) {
    const types = params.apt_types.split(',');
    query = query.in('type', types);
  }

  // --- FilterContainer filters ---

  // Bedrooms
  if (params.bedrooms && !params.apt_types) {
    if (params.bedrooms === "4+") query = query.gte('no_bedrooms', 4);
    else query = query.eq('no_bedrooms', Number(params.bedrooms));
  }

  // Bathrooms
  if (params.bathrooms) {
    if (params.bathrooms === "4+") query = query.gte('no_bathrooms', 4);
    else query = query.eq('no_bathrooms', Number(params.bathrooms));
  }

  // Size range
  if (params.size_min) query = query.gte('area_sqm', Number(params.size_min));
  if (params.size_max) query = query.lte('area_sqm', Number(params.size_max));

  // Furnishing
  if (params.furnishing) {
    query = query.in('furnished_type', params.furnishing.split(','));
  }

  // Amenities
  if (params.amenities) {
    query = query.contains('amenities', params.amenities.split(','));
  }

  // Sorting
  switch (params.sort) {
    case "price_asc":  query = query.order('monthly_rent', { ascending: true });  break;
    case "price_desc": query = query.order('monthly_rent', { ascending: false }); break;
    case "popular":    query = query.order('average_rating', { ascending: false }); break;
    default:           query = query.order('created_at', { ascending: false });
  }

  const PAGE_SIZE = 25;

  const page = Number(params.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data: apartments, error, count } = await query;
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
      <Suspense>
        <SearchContainer />
      </Suspense>
      <div className="mt-4 flex flex-col md:flex-row gap-3">
        <Suspense>
          <div className="md:w-1/4 self-start">
            <FilterContainer resultCount={mapped.length} />
          </div>
        </Suspense>
        <div className="w-full md:w-3/4 bg-white rounded-lg p-0">
          <Suspense>
            <RenderApartments
              apartment={mapped}
              page={page}
              totalCount={count ?? 0}
              pageSize={PAGE_SIZE}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
