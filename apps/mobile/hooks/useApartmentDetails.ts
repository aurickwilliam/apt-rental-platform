import { useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';

export type ApartmentDetails = {
  id: string;
  name: string;
  description: string;
  type: string;
  monthly_rent: number;
  no_bedrooms: number;
  no_bathrooms: number;
  area_sqm: number;
  average_rating: number | null;
  no_ratings: number;
  amenities: string[];
  street_address: string;
  barangay: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  lease_agreement_url: string | null;
  floor_level: string | null;
  furnished_type: string | null;
  lease_duration: string | null;
  max_occupants: number | null;
  security_deposit: number | null;
  advance_rent: number | null;
  landlord: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    mobile_number: string;
    avatar_url: string | null;
  } | null;
  apartment_images: {
    id: string;
    url: string;
    is_cover: boolean;
  }[];
};

export type ReviewWithTenant = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  tenant: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
};

export function useApartmentDetails(apartmentId: string) {
  const [apartment, setApartment] = useState<ApartmentDetails | null>(null);
  const [reviews, setReviews] = useState<ReviewWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apartmentId) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      // Fetch apartment + images + landlord
      const { data: aptData, error: aptError } = await supabase
        .from('apartments')
        .select(`
          id,
          name,
          description,
          type,
          monthly_rent,
          no_bedrooms,
          no_bathrooms,
          area_sqm,
          average_rating,
          no_ratings,
          amenities,
          street_address,
          barangay,
          city,
          latitude,
          longitude,
          lease_agreement_url,
          floor_level,
          furnished_type,
          lease_duration,
          max_occupants,
          security_deposit,
          advance_rent,
          landlord:landlord_id (
            id,
            first_name,
            last_name,
            email,
            mobile_number,
            avatar_url
          ),
          apartment_images (
            id,
            url,
            is_cover
          )
        `)
        .eq('id', apartmentId)
        .single();

      if (aptError) {
        setError(aptError.message);
        setLoading(false);
        return;
      }

      setApartment(aptData as ApartmentDetails);

      // Fetch top 2 reviews with tenant info
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          tenant:tenant_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('apartment_id', apartmentId)
        .order('created_at', { ascending: false })
        .limit(2);

      if (!reviewError && reviewData) {
        setReviews(reviewData as ReviewWithTenant[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [apartmentId]);

  return { apartment, reviews, loading, error };
}