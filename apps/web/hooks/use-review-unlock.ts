"use client";

import { useEffect, useState } from "react";

import { createBrowserClient } from "@repo/supabase";

import { getTenantContext } from "@/service/favoritesService";
import { isReviewStayEligible } from "@/service/reviewsService";

export interface ReviewUnlockCandidate {
  tenancyId: string;
  apartmentId: string;
  apartmentName: string;
}

const SEEN_KEY_PREFIX = "review-unlock-modal-seen:";

export function isReviewUnlockSeen(tenancyId: string): boolean {
  try {
    return localStorage.getItem(`${SEEN_KEY_PREFIX}${tenancyId}`) !== null;
  } catch {
    return false;
  }
}

export function markReviewUnlockSeen(tenancyId: string): void {
  try {
    localStorage.setItem(`${SEEN_KEY_PREFIX}${tenancyId}`, "1");
  } catch {
    // Storage unavailable — the modal may show again, which is acceptable.
  }
}

type ApartmentEmbed = {
  id: string;
  name: string;
  is_hidden_by_admin: boolean | null;
  deleted_at: string | null;
};

type UnlockRow = {
  id: string;
  apartment_id: string;
  lease_start: string | null;
  lease_end: string | null;
  apartment: ApartmentEmbed | ApartmentEmbed[] | null;
  reviews: unknown;
};

/**
 * Finds the newest stay that just became reviewable (3 months reached or
 * tenancy ended) and hasn't been reviewed or dismissed yet. Returns null
 * otherwise. Silent on every failure — this powers an informational modal
 * that must never break the page.
 */
export function useReviewUnlock() {
  const [candidate, setCandidate] = useState<ReviewUnlockCandidate | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const context = await getTenantContext();
        if (!context.tenantId || cancelled) return;

        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("tenancies")
          .select(
            "id, apartment_id, lease_start, lease_end, apartment:apartments(id, name, is_hidden_by_admin, deleted_at), reviews(id)",
          )
          .eq("tenant_id", context.tenantId)
          .order("lease_start", { ascending: false })
          .limit(10);

        if (error || cancelled) return;

        const match = ((data ?? []) as unknown as UnlockRow[]).find((tenancy) => {
          const apartment = Array.isArray(tenancy.apartment)
            ? tenancy.apartment[0]
            : tenancy.apartment;
          // Never offer a review for an apartment tenants can no longer open.
          if (!apartment || apartment.is_hidden_by_admin || apartment.deleted_at) return false;
          const hasReview =
            !!tenancy.reviews &&
            !(Array.isArray(tenancy.reviews) && tenancy.reviews.length === 0);
          if (hasReview) return false;
          if (isReviewUnlockSeen(tenancy.id)) return false;
          return isReviewStayEligible(tenancy.lease_start, tenancy.lease_end);
        });

        if (!match || cancelled) return;

        const apartment = Array.isArray(match.apartment) ? match.apartment[0] : match.apartment;
        setCandidate({
          tenancyId: match.id,
          apartmentId: match.apartment_id,
          apartmentName: apartment?.name ?? "your apartment",
        });
      } catch {
        // Informational only — never surface errors for the unlock check.
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return candidate;
}
