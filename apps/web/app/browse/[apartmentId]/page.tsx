import Amenities from "./components/Amenities";
import BackBtn from "./components/BackBtn";
import ImageHeader from "./components/ImageHeader";
import RatingSection from "./components/RatingsSection";
import MapLocation from "./components/MapLocation";

import { Divider } from "@heroui/react";

import { House, BedDouble, Bath, Expand } from "lucide-react";

import RenderReviews from "./components/RenderReviews";
import RelatedApartments from "./components/RelatedApartments";
import PriceCard from "./components/PriceCard";
import LandlordCard from "./components/LandlordCard";
import ShareBtn from "./components/ShareBtn";
import FavoriteBtn from "./components/FavoriteBtn";

import { createClient } from "@repo/supabase/server";

export default async function ApartmentDetailsPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;

  const supabase = await createClient();

  // Fetch apartment details along with images
  const { data: apartment, error } = await supabase
    .from('apartments')
    .select(`
      *,
      apartment_images(url, is_cover)
    `)
    .eq('id', apartmentId)
    .single();

  // Fetch landlord details if landlord_id exists
  const { data: landlord } = apartment?.landlord_id
    ? await supabase
        .from('users')
        .select('first_name, last_name, mobile_number, avatar_url')
        .eq('id', apartment.landlord_id)
        .eq('role', 'landlord')
        .single()
    : { data: null };

  // Fetch star ratings for the apartment
  const { data: starCounts } = await supabase
    .from('reviews')
    .select('rating')
    .eq('apartment_id', apartmentId);

  const countStars = (star: number) =>
    starCounts?.filter((r) => r.rating === star).length ?? 0;

  if (error || !apartment) {
    // handle not found
    return <div>Apartment not found.</div>;
  }

  const images = apartment.apartment_images?.map((img) => img.url) ?? ['/default/default-thumbnail.jpeg'];

  // Fetch Related Apartments same city
  const { data: related } = await supabase
    .from('apartments')
    .select('id, name, city, monthly_rent, average_rating, apartment_images(url, is_cover)')
    .eq('city', apartment.city)
    .neq('id', apartmentId)
    .limit(10);

  const relatedMapped = (related ?? []).map((apt) => ({
    id: apt.id,
    name: apt.name,
    city: apt.city,
    monthly_rent: apt.monthly_rent,
    average_rating: apt.average_rating ?? 0,
    image: apt.apartment_images?.find((img) => img.is_cover)?.url ?? '/default/default-thumbnail.jpeg',
  }));

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between">
        <BackBtn />
        <div className="flex items-center gap-2">
          <ShareBtn />
          <FavoriteBtn />
        </div>
      </div>

      <div className="my-4">
        <ImageHeader imageUrl={images} />
      </div>

      <div className="w-full flex gap-5">
        <div className="w-2/3">
          {/* Name and Address */}
          <div>
            <h1 className="text-3xl font-medium font-noto-serif text-primary">
              {apartment.name}
            </h1>
            <h3>
              {apartment.street_address}, {apartment.barangay}, {apartment.city}, {apartment.province}, {apartment.zip_code}
            </h3>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex gap-2 items-center">
              <House size={22} className="text-grey-700" />
              <h2 className="text-base font-medium text-grey-700">
                {apartment.type}
              </h2>
            </div>
            <div className="flex gap-2 items-center">
              <BedDouble size={22} className="text-grey-700" />
              <h2 className="text-base font-medium text-grey-700">
                {apartment.no_bedrooms} Bedroom{apartment.no_bedrooms !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="flex gap-2 items-center">
              <Bath size={22} className="text-grey-700" />
              <h2 className="text-base font-medium text-grey-700">
                {apartment.no_bathrooms} Bathroom{apartment.no_bathrooms !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="flex gap-2 items-center">
              <Expand size={22} className="text-grey-700" />
              <h2 className="text-base font-medium text-grey-700">
                {apartment.area_sqm} sqm
              </h2>
            </div>
          </div>

          <Divider className="my-8" />

          <div className="max-h-64 overflow-y-auto">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p>{apartment.description}</p>
          </div>

          <Divider className="my-8" />

          <Amenities apartmentPerks={apartment.amenities ?? []} />

          <Divider className="my-8" />

          <div>
            <h3 className="text-lg font-medium mb-2">View on Map</h3>
            <MapLocation latitude={apartment.latitude} longitude={apartment.longitude} />
          </div>

          <Divider className="my-8" />

          <RatingSection
            overallRate={apartment.average_rating ?? 0}
            totalReviews={apartment.no_ratings ?? 0}
            no5Star={countStars(5)}
            no4Star={countStars(4)}
            no3Star={countStars(3)}
            no2Star={countStars(2)}
            no1Star={countStars(1)}
          />

          <div className="mt-8">
            <RenderReviews apartmentId={apartment.id} />
          </div>
        </div>

        <div className="w-1/3 flex flex-col gap-5">
          <PriceCard price={apartment.monthly_rent} />

          <LandlordCard
            name={`${landlord?.first_name} ${landlord?.last_name}`}
            avatarUrl={landlord?.avatar_url ?? ''}
            contactInfo={landlord?.mobile_number ?? ''}
          />
        </div>
      </div>

      <div className="w-full mt-10">
        <RelatedApartments apartments={relatedMapped} />
      </div>
    </div>
  );
}
