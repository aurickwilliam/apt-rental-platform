import { useCallback, useEffect, useState } from "react";
import { supabase } from "@repo/supabase";
import { useProfile } from "@/hooks/useProfile";

export type LandlordVisitRequest = {
  id: string;
  visit_date: string;
  time: string;
  no_visitors: number;
  notes: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "rescheduled";
  rejected_reason: string | null;
  responded_at: string | null;
  confirmed_visit_date: string | null;
  confirmed_time: string | null;
  created_at: string;
  tenant: {
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    mobile_number: string | null;
  };
  apartment: {
    name: string;
    barangay: string;
    street_address: string;
    city: string;
    province: string;
    zip_code: number | null;
    apartment_images: { url: string }[];
  };
};

export function useLandlordVisitRequests() {
  const { profile } = useProfile();
  const [visitRequests, setVisitRequests] = useState<LandlordVisitRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisitRequests = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("visit_request")
      .select(`
        id,
        visit_date,
        time,
        no_visitors,
        notes,
        status,
        rejected_reason,
        responded_at,
        confirmed_visit_date,
        confirmed_time,
        created_at,
        tenant:users!visit_request_tenant_id_fkey (
          first_name,
          last_name,
          avatar_url,
          mobile_number
        ),
        apartment:apartments!visit_request_apartment_id_fkey (
          name,
          barangay,
          street_address,
          city,
          province,
          zip_code,
          apartment_images!inner (
            url
          )
        )
      `)
      .eq("landlord_id", profile.id)
      .eq("apartment.apartment_images.is_cover", true)
      .order("visit_date", { ascending: true });

    if (!error && data) {
      setVisitRequests(data as LandlordVisitRequest[]);
    }

    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    fetchVisitRequests();
  }, [fetchVisitRequests]);

  return { visitRequests, loading, refetch: fetchVisitRequests };
}
