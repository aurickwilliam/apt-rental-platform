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

type RawApartmentImage = {
  url: string;
  is_cover: boolean | null;
};

const signedUrlCache = new Map<string, { signedUrl: string; expiresAt: number }>();
const SIGNED_URL_TTL_MS = 55 * 60 * 1000; // 55 minutes

async function resolveApartmentImageUrls(paths: string[]): Promise<Map<string, string>> {
  const uncached: string[] = [];
  const result = new Map<string, string>();

  for (const path of paths) {
    const cached = signedUrlCache.get(path);
    if (cached && Date.now() < cached.expiresAt) {
      result.set(path, cached.signedUrl);
    } else {
      uncached.push(path);
    }
  }

  if (uncached.length > 0) {
    const { data } = await supabase.storage
      .from("apartment-images")
      .createSignedUrls(uncached, 60 * 60);

    for (const item of data ?? []) {
      if (item.signedUrl && item.path) {
        signedUrlCache.set(item.path, {
          signedUrl: item.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_TTL_MS,
        });
        result.set(item.path, item.signedUrl);
      }
    }
  }

  return result;
}

export function useLandlordVisitRequests() {
  const { profile, loading: profileLoading } = useProfile();
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
          apartment_images (
            url,
            is_cover
          )
        )
      `)
      .eq("landlord_id", profile.id)
      .order("visit_date", { ascending: true });

    if (!error && data) {
      // Collect all cover image paths across all requests in one batch
      const coverPaths: string[] = [];
      for (const r of data) {
        const images = (r.apartment?.apartment_images ?? []) as RawApartmentImage[];
        const cover = images.find((img) => img.is_cover === true);
        if (cover?.url) coverPaths.push(cover.url);
      }

      const urlMap = await resolveApartmentImageUrls(coverPaths);

      const normalized: LandlordVisitRequest[] = data.map((r) => {
        const images = (r.apartment?.apartment_images ?? []) as RawApartmentImage[];
        const cover = images.find((img) => img.is_cover === true);
        const resolvedUrl = cover?.url ? (urlMap.get(cover.url) ?? cover.url) : null;

        return {
          ...r,
          apartment: {
            ...r.apartment,
            apartment_images: resolvedUrl ? [{ url: resolvedUrl }] : [],
          },
        } as LandlordVisitRequest;
      });

      setVisitRequests(normalized);
    }

    setLoading(false);
  }, [profile?.id]);

  useEffect(() => {
    if (!profileLoading) {
      fetchVisitRequests();
    }
  }, [fetchVisitRequests, profileLoading]);

  return { visitRequests, loading, refetch: fetchVisitRequests };
}
