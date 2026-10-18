import { supabase } from "@repo/supabase";

/**
 * Checks that a map pin lies inside the selected CAMANAVA city, using the same
 * boundary data as the database guard on `apartments`. Feedback only: the
 * database still decides on insert/update.
 */
export async function isPinInsideCamanavaCity(
  city: string,
  latitude: number,
  longitude: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("validate_camanava_location", {
    p_city: city,
    p_latitude: latitude,
    p_longitude: longitude,
  });

  if (error) throw error;
  return data === true;
}
