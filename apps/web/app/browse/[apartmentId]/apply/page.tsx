import ApartmentNotFound from "./components/ApartmentNotFound";
import ApplyClient from "./components/ApplyClient";
import { loadApplyPage } from "./lib/load-apply-page";

export default async function ApplyPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;
  const data = await loadApplyPage(apartmentId);
  if (!data) return <ApartmentNotFound />;

  return <ApplyClient {...data} />;
}
