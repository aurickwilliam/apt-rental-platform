import { useState, useCallback } from "react";
import { supabase } from "@repo/supabase";

import { ApartmentStatus, VALID_APARTMENT_STATUSES } from '@repo/constants'

export type Apartment = {
  id: string;
  name: string;
  barangay: string;
  city: string;
  status: ApartmentStatus;
  isVerified: boolean;
  coverUrl: string | null;
  monthlyRent?: number;
};

async function fetchMonthlyProfit(landlordId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const { data: aptData, error: aptError } = await supabase
    .from("apartments")
    .select("id")
    .eq("landlord_id", landlordId)
    .is("deleted_at", null);

  if (aptError) throw aptError;

  const apartmentIds = (aptData ?? []).map((a) => a.id);
  if (apartmentIds.length === 0) return 0;

  const { data: payments, error: payError } = await supabase
    .from("payment")
    .select("amount")
    .in("apartment_id", apartmentIds)
    .eq("status", "paid")
    .gte("date", startOfMonth)
    .lte("date", endOfMonth);

  if (payError) throw payError;

  return (payments ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
}

export function useLandlordUnits() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [monthlyProfit, setMonthlyProfit] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApartments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (userError || !userData) throw userError;

      const [apartmentsResult, profit] = await Promise.all([
        supabase
          .from("apartments")
          .select("id, name, barangay, city, status, is_verified, apartment_images (url, is_cover), monthly_rent")
          .eq("landlord_id", userData.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false }),
        fetchMonthlyProfit(userData.id),
      ]);

      if (apartmentsResult.error) throw apartmentsResult.error;

      const mapped: Apartment[] = (apartmentsResult.data ?? []).map((apt) => {
        const images = apt.apartment_images ?? [];
        const cover = images.find((img) => img.is_cover) ?? images[0] ?? null;
        const rawStatus = apt.status ?? "available";

        return {
          id: apt.id,
          name: apt.name,
          barangay: apt.barangay,
          city: apt.city,
          status: VALID_APARTMENT_STATUSES.includes(rawStatus as ApartmentStatus)
            ? (rawStatus as ApartmentStatus)
            : "available",
          isVerified: apt.is_verified ?? false,
          coverUrl: cover?.url ?? null,
          monthlyRent: apt.monthly_rent ?? undefined,
        };
      });

      setApartments(mapped);
      setMonthlyProfit(profit);
    } catch (err) {
      console.error("Error fetching landlord units:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { apartments, monthlyProfit, loading, fetchApartments };
}
