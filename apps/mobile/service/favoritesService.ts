import { supabase, type Database } from '@repo/supabase';

type FavoriteRow = Database['public']['Tables']['favorites']['Row'];
type ApartmentImageRow = Database['public']['Tables']['apartment_images']['Row'];
type ApartmentRow = Database['public']['Tables']['apartments']['Row'];

export type FavoriteApartment = Pick<
  ApartmentRow,
  | 'id'
  | 'name'
  | 'barangay'
  | 'city'
  | 'average_rating'
  | 'monthly_rent'
  | 'no_bedrooms'
  | 'no_bathrooms'
  | 'area_sqm'
> & {
  apartment_images: Pick<ApartmentImageRow, 'url' | 'is_cover' | 'created_at'>[] | null;
};

export async function getCurrentTenantId(): Promise<string | null> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return profile?.id ?? null;
}

export async function fetchFavoriteApartmentIds(tenantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select('apartment_id, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => row.apartment_id);
}

export async function insertFavorite(tenantId: string, apartmentId: string): Promise<FavoriteRow> {
  const { data, error } = await supabase
    .from('favorites')
    .insert({
      tenant_id: tenantId,
      apartment_id: apartmentId,
    })
    .select('*')
    .single();

  if (error) throw error;

  return data;
}

export async function deleteFavorite(tenantId: string, apartmentId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('apartment_id', apartmentId);

  if (error) throw error;
}

export async function fetchApartmentsByIds(apartmentIds: string[]): Promise<FavoriteApartment[]> {
  if (apartmentIds.length === 0) return [];

  const { data, error } = await supabase
    .from('apartments')
    .select(`
      id,
      name,
      barangay,
      city,
      average_rating,
      monthly_rent,
      no_bedrooms,
      no_bathrooms,
      area_sqm,
      apartment_images (
        url,
        is_cover,
        created_at
      )
    `)
    .is('deleted_at', null)
    .in('id', apartmentIds);

  if (error) throw error;

  return (data ?? []) as FavoriteApartment[];
}
