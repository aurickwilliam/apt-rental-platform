import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@repo/supabase';
import { ApartmentStatus, VALID_APARTMENT_STATUSES } from '@repo/constants';

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
  province: string;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  lease_agreement_url: string | null;
  floor_level: string | null;
  furnished_type: string | null;
  lease_duration: string | null;
  max_occupants: number | null;
  security_deposit: number | null;
  advance_rent: number | null;
  status: ApartmentStatus;
  is_verified: boolean;
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
  stayed_date: string | null;
  tenant: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  } | null;
};

const APARTMENT_SELECT = `
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
  province,
  zip_code,
  latitude,
  longitude,
  lease_agreement_url,
  floor_level,
  furnished_type,
  lease_duration,
  max_occupants,
  security_deposit,
  advance_rent,
  status,
  is_verified,
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
`;

const REVIEW_SELECT = `
  id,
  rating,
  comment,
  created_at,
  stayed_date,
  tenant:users!reviews_tenant_id_fkey (
    first_name,
    last_name,
    avatar_url
  )
`;

const REVIEW_PREVIEW_LIMIT = 3;

function normalizeStatus(rawStatus: string | null): ApartmentStatus {
  const status = rawStatus ?? 'available';
  return VALID_APARTMENT_STATUSES.includes(status as ApartmentStatus)
    ? (status as ApartmentStatus)
    : 'available';
}

export function useApartmentDetails(apartmentId: string) {
  const [apartment, setApartment] = useState<ApartmentDetails | null>(null);
  const [reviews, setReviews] = useState<ReviewWithTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!apartmentId) return;

    setLoading(true);
    setError(null);

    const [aptResult, reviewResult] = await Promise.all([
      supabase
        .from('apartments')
        .select(APARTMENT_SELECT)
        .eq('id', apartmentId)
        .single(),
      supabase
        .from('reviews')
        .select(REVIEW_SELECT)
        .eq('apartment_id', apartmentId)
        .order('created_at', { ascending: false })
        .limit(REVIEW_PREVIEW_LIMIT),
    ]);

    const { data: aptData, error: aptError } = aptResult;
    const { data: reviewData, error: reviewError } = reviewResult;

    if (aptError) {
      setError(aptError.message);
      setApartment(null);
      setReviews([]);
      setLoading(false);
      return;
    }

    setApartment({
      ...aptData,
      status: normalizeStatus(aptData.status),
    } as ApartmentDetails);

    if (reviewError) {
      // Don't fail the whole screen over reviews, but don't silently keep
      // stale data either — clear it and surface the error for logging/UI.
      console.error('Failed to fetch reviews:', reviewError.message);
      setReviews([]);
      setError((prev) => prev ?? reviewError.message);
    } else {
      setReviews((reviewData ?? []) as ReviewWithTenant[]);
    }

    setLoading(false);
  }, [apartmentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { apartment, reviews, loading, error, refetch: fetchData };
}
