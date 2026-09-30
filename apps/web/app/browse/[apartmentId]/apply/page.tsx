import { createClient } from "@repo/supabase/server";
import ApplyClient from "./components/ApplyClient";
import { getApplyApartmentContext } from "./lib/get-apply-context";

export default async function ApplyPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;
  const supabase = await createClient();

  const apartmentContext = await getApplyApartmentContext(supabase, apartmentId);

  if (!apartmentContext) {
    return (
      <div className="max-w-3xl mx-auto p-4 py-12 text-center">
        <h1 className="text-2xl font-semibold">Apartment not found</h1>
        <p className="text-grey-700 mt-2">The listing you are trying to apply for does not exist.</p>
      </div>
    );
  }

  return <ApplyClient apartment={apartmentContext} />;
}
