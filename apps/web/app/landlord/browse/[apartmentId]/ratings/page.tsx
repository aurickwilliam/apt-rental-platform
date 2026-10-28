import ApartmentRatingsView from "@/app/browse/[apartmentId]/components/ApartmentRatingsView";
import { requirePortalViewer } from "@/lib/server-identity";

export default async function LandlordRatingsPage() {
  await requirePortalViewer("landlord");

  return <ApartmentRatingsView />;
}
