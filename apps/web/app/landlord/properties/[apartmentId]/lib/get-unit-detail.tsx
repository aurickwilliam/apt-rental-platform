import { createClient } from "@repo/supabase/server";
import { getServerIdentity } from "@/lib/server-identity";
import { fetchLandlordUnitDetail, fetchLandlordUnitApartment, fetchLandlordUnitDescription, type LandlordUnitDetail, type LandlordUnitApartment } from "@/service/landlordUnitDetailService";

export type UnitLoadError = { title: string; message: string };

export type UnitLoadResult = { detail: LandlordUnitDetail } | { error: UnitLoadError };

// Server-only loader shared by the property homepage + sub-pages.
// Verifies the signed-in landlord owns the apartment; RLS gates the rows too.
export async function getLandlordUnitDetail(apartmentId: string): Promise<UnitLoadResult> {
  const result = await loadOwnedUnit(apartmentId, fetchLandlordUnitDetail);
  return "error" in result ? result : { detail: result };
}

export async function getLandlordApartment(apartmentId: string) {
  return loadOwnedUnit(apartmentId, async (supabase, id) => {
    const apartment = await fetchLandlordUnitApartment(supabase, id);
    return apartment ? { apartment } : null;
  });
}

export async function getLandlordDescription(apartmentId: string) {
  return loadOwnedUnit(apartmentId, fetchLandlordUnitDescription);
}

async function loadOwnedUnit<T extends { apartment: LandlordUnitApartment }>(
  apartmentId: string,
  load: (supabase: Awaited<ReturnType<typeof createClient>>, id: string) => Promise<T | null>,
): Promise<T | { error: UnitLoadError }> {
  const { supabase, user, profile } = await getServerIdentity();
  if (!user) return { error: { title: "Not authenticated", message: "Please sign in to view this property." } };

  if (!profile?.roles.includes("landlord")) {
    return { error: { title: "Unauthorized", message: "Only landlords can view this page." } };
  }

  try {
    const detail = await load(supabase, apartmentId);
    if (!detail || detail.apartment.landlord_id !== (profile.id as string)) {
      return {
        error: {
          title: "Property not found",
          message: "This property does not exist or you don't have access to it.",
        },
      };
    }
    return detail;
  } catch {
    return {
      error: { title: "Could not load property", message: "Something went wrong. Please try again." },
    };
  }
}

export function UnitNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4 md:p-6">
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="font-nunito font-semibold text-card-foreground">{title}</p>
        <p className="mt-1 text-sm font-nunito text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
