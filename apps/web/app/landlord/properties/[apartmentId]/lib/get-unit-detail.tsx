import { createClient } from "@repo/supabase/server";
import { fetchLandlordUnitDetail, type LandlordUnitDetail } from "@/service/landlordUnitDetailService";

export type UnitLoadError = { title: string; message: string };

export type UnitLoadResult = { detail: LandlordUnitDetail } | { error: UnitLoadError };

// Server-only loader shared by the property homepage + sub-pages.
// Verifies the signed-in landlord owns the apartment; RLS gates the rows too.
export async function getLandlordUnitDetail(apartmentId: string): Promise<UnitLoadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: { title: "Not authenticated", message: "Please sign in to view this property." } };

  const { data: profile } = await supabase
    .from("users")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || (profile.role as string) !== "landlord") {
    return { error: { title: "Unauthorized", message: "Only landlords can view this page." } };
  }

  try {
    const detail = await fetchLandlordUnitDetail(supabase, apartmentId);
    if (!detail || detail.apartment.landlord_id !== (profile.id as string)) {
      return {
        error: {
          title: "Property not found",
          message: "This property does not exist or you don't have access to it.",
        },
      };
    }
    return { detail };
  } catch {
    return {
      error: { title: "Could not load property", message: "Something went wrong. Please try again." },
    };
  }
}

export function UnitNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <p className="font-nunito font-semibold text-card-foreground">{title}</p>
        <p className="mt-1 text-sm font-nunito text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
