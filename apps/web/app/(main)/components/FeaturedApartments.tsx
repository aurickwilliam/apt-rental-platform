import type { createClient } from "@repo/supabase/server";
import { rankTenantLovedApartments } from "@/lib/tenant-loved-apartments";
import ApartmentCarousel from "./ApartmentCarousel";
import FeaturedApartmentsState from "./FeaturedApartmentsState";

interface FeaturedApartmentsProps {
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export default async function FeaturedApartments({ supabase }: FeaturedApartmentsProps) {
  const { data: apartments, error } = await supabase
    .from('apartments')
    .select(`
      id,
      name,
      city,
      monthly_rent,
      average_rating,
      no_ratings,
      created_at,
      apartment_images(url, is_cover)
    `)
    .eq('is_hidden_by_admin', false)
    .is('deleted_at', null)
    .eq("status", "available")
    .eq("is_verified", true)
    .limit(100)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <FeaturedApartmentsState state="error" />;
  }

  const mapped = rankTenantLovedApartments(apartments ?? []).map((apt) => ({
    id: apt.id,
    name: apt.name,
    location: apt.city,
    price: apt.monthly_rent,
    rating: apt.average_rating ?? 0,
    image: apt.apartment_images?.find((img) => img.is_cover)?.url ?? '/default/default-thumbnail.jpeg',
  }));

  return mapped.length > 0 ? <ApartmentCarousel apartment={mapped} /> : <FeaturedApartmentsState state="empty" />;
}
