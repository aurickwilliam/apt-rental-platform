import ApartmentNotFound from "@/app/browse/[apartmentId]/apply/components/ApartmentNotFound";
import ApplyClient from "@/app/browse/[apartmentId]/apply/components/ApplyClient";
import { loadApplyPage } from "@/app/browse/[apartmentId]/apply/lib/load-apply-page";

export default async function TenantApplyPage({ params }: { params: Promise<{ apartmentId: string }> }) {
  const { apartmentId } = await params;
  const data = await loadApplyPage(apartmentId);
  if (!data) return <ApartmentNotFound />;

  return <ApplyClient {...data} />;
}
