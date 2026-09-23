import { getLandlordUnitDetail, UnitNotice } from "../lib/get-unit-detail";
import PaymentHistoryClient from "./components/PaymentHistoryClient";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ apartmentId: string }>;
};

export default async function LandlordPropertyPaymentHistoryPage({ params }: PageProps) {
  const { apartmentId } = await params;
  const result = await getLandlordUnitDetail(apartmentId);
  if ("error" in result) {
    return <UnitNotice title={result.error.title} message={result.error.message} />;
  }
  return (
    <PaymentHistoryClient apartmentId={apartmentId} apartmentName={result.detail.apartment.name} />
  );
}
