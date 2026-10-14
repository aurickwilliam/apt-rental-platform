import { supabase } from '@repo/supabase';

import { coverImageUrl, type ApartmentImageRow } from '@/service/apartments/coverImage';

/** The apartment a chat is about, as shown in the pinned card under the header. */
export interface ChatApartmentSummary {
  id: string;
  name: string;
  location: string;
  monthlyRent: number;
  thumbnailUrl: string | null;
}

export interface ChatApartmentContext {
  apartment: ChatApartmentSummary | null;
  /** Either person is the apartment's active tenant: not an inquiry. */
  hasActiveTenancy: boolean;
}

interface ChatApartmentRow {
  id: string;
  name: string;
  barangay: string | null;
  city: string | null;
  monthly_rent: number | null;
  apartment_images: ApartmentImageRow[] | null;
}

export function toChatApartmentSummary(row: ChatApartmentRow): ChatApartmentSummary {
  return {
    id: row.id,
    name: row.name,
    location: [row.barangay, row.city].filter(Boolean).join(', '),
    monthlyRent: Number(row.monthly_rent ?? 0),
    thumbnailUrl: coverImageUrl(row.apartment_images, 'thumb'),
  };
}

/**
 * Loads the chat's apartment and whether the two people already share an
 * active tenancy there (RLS limits tenancies to the tenant and the landlord).
 */
export async function fetchChatApartmentContext(
  apartmentId: string,
  myId: string,
  otherUserId: string
): Promise<ChatApartmentContext> {
  const [apartmentResult, tenancyResult] = await Promise.all([
    supabase
      .from('apartments')
      .select('id, name, barangay, city, monthly_rent, apartment_images (url, url_thumb, is_cover, created_at)')
      .eq('id', apartmentId)
      .maybeSingle(),
    supabase
      .from('tenancies')
      .select('id', { count: 'exact', head: true })
      .eq('apartment_id', apartmentId)
      .eq('status', 'active')
      .in('tenant_id', [myId, otherUserId]),
  ]);

  if (apartmentResult.error) throw apartmentResult.error;
  if (tenancyResult.error) throw tenancyResult.error;

  const row = apartmentResult.data as ChatApartmentRow | null;
  return {
    apartment: row ? toChatApartmentSummary(row) : null,
    hasActiveTenancy: (tenancyResult.count ?? 0) > 0,
  };
}
