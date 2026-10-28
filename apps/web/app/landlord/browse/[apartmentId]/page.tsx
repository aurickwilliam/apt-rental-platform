import ApartmentDetailView from "@/app/browse/[apartmentId]/components/ApartmentDetailView";
import { requirePortalViewer } from "@/lib/server-identity";

// A listing opened from inside the landlord portal (e.g. from a tenant's past
// stays), so the sidebar stays instead of the public top bar.
export default async function LandlordApartmentDetailsPage({
  params,
}: {
  params: Promise<{ apartmentId: string }>;
}) {
  const { apartmentId } = await params;
  await requirePortalViewer("landlord");

  return <ApartmentDetailView apartmentId={apartmentId} basePath="/landlord/browse" />;
}
