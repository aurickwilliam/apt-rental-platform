import ApartmentDetailView from "./components/ApartmentDetailView";

export default async function ApartmentDetailsPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;

  return <ApartmentDetailView apartmentId={apartmentId} basePath="/browse" />;
}
